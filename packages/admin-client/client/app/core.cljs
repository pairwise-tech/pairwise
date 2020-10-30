(ns app.core
  "This namespace contains your application and is the entrypoint for 'yarn start'."
  (:require [reagent.core :as r]
            [clojure.core.async :as async :refer [>! <! chan]]
            [clojure.string :refer [starts-with? join]]
            [clojure.walk :refer [keywordize-keys]]
            [clojure.spec.alpha :as spec]
            [clojure.spec.gen.alpha :as gen]
            [clojure.test.check.generators]
            ["axios" :as axios]
            ["@blueprintjs/core" :as bp]
            [app.hello :refer [hello]]))

;; Generate emails. They are all at gmamil.com, but i'm not sure how to combine
;; multiple string generators yet
(def string-alnum-gen (gen/such-that #(and (not= % "") (> (count %) 5)) (gen/string-alphanumeric) 100))
(def email-host-gen (spec/gen #{"gmail.com" "hotmail.com" "yahoo.com.tw" "protonmail.com" "fastmail.io"}))

;; NOTE Spec or requires a keyword along with the predicate to help identify
;; which test failed. Not sure why spec/and doesn't require this though
;; (spec/def ::email (spec/or :string string? :nil nil?))
;; NOTE Use the nilable helper rather than or if you just want nilable values

;; These should be overwritten in the edn config file or on the command line via
;; --config-merge
(goog-define NODE_ENV "_UNSET_")
(goog-define ADMIN_TOKEN "_UNSET_")
(comment
  app.core/NODE_ENV
  app.core/ADMIN_TOKEN)

(def request-headers (clj->js {:headers {:admin_access_token ADMIN_TOKEN}}))

(def ADMIN_URL "https://pairwise-production-server-ous2w5vwba-uc.a.run.app/admin")

(def ->url #(str ADMIN_URL %))
(comment
  (js/console.log (->url "/users"))
  (-> axios
      (.get (->url "/users") request-headers)
      (.then #(-> % .-data))
      (.then #(aset js/window "_data" %))
      (.catch #(println "Got an error!" %))))

(spec/def ::id uuid?)
(spec/def ::email
  (spec/with-gen
    (spec/and string?
              #(re-matches #"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$" %))
    #(gen/fmap (fn [[a b]] (str a "@" b))
               (gen/tuple string-alnum-gen email-host-gen))))

(clj->js {:wee true})
(def q #queue [:a :b :c])
(def v [:a :b :c])
(println {:hey "you"})
(println #js{:hey "you"})
(js/console.log {:hey "you"})
(js/console.log #js{:hey "you"})

(spec/def ::name (spec/nilable string?))
(spec/def ::user (spec/keys :req-un [::id ::email ::name]))

(comment
  (gen/sample (gen/tuple string-alnum-gen email-host-gen))
  (spec/valid? string? "")
  (spec/valid? nil? "hey")

  ;; Hm, not actually sure what a uuid is
  (spec/valid? ::user {:id (uuid "3f716909-e631-4458-b820-6a46cf5113b0") :name "Ian" :email "mail@mail.com"})

  (spec/valid? ::email "hey@mail.com")
  (spec/valid? ::email "hey")
  (spec/valid? ::email "")
  (spec/valid? ::email nil)
  (spec/valid? ::email 9)

  (gen/sample (spec/gen ::email))
  (gen/sample (spec/gen int?))
  (gen/sample (spec/gen ::user)))

(defn get-initial-state
  [& {:as overrides}]
  (let [defaults {:route "/" :users {}}]
    (merge defaults overrides)))

(def state (r/atom (get-initial-state)))

(aset js/window "axios" axios)
(aset js/window "hdrs" request-headers)
(aset js/window "getState" (fn [] (clj->js @state)))

(defn e->href [e] (-> e .-target .-href))

(defn href->pathname
  "Given a full href from the href attribute of a link, get the relevant part
  for on-site routing"
  [href]
  (let [url (-> href (js/URL.))]
    (str (.-pathname url) (.-search url) (.-hash url))))

(def click->href (comp href->pathname e->href))

(defn handle-state-change
  [_k _state prev-state next-state]
  (println "State just changed!" prev-state next-state)
  (when (not= (:route prev-state) (:route next-state))
    (js/history.pushState {} "" (:route next-state))))

;; FIXME This doesn't work for some reason. Breaks the back button, but
;; seemingly not consistently
(defn sync-url-to-state! [_e]
  (let [pathname (-> js/document (.-location) (.-href) href->pathname)]
    (swap! state update :route (constantly pathname))))

(defn app-init
  "Initialize the App. Run one-time setup."
  []
  (js/addEventListener "popstate" sync-url-to-state!)
  (println "Initializing APP with state", @state)
  (-> bp/FocusStyleManager .onlyShowFocusOnTabs)
  (swap! state update :route (constantly (href->pathname js/location.href))) ;; Set initial route from URL
  (add-watch state :app-state handle-state-change)
  (fn [] (remove-watch state :app-state)))

(comment
  (reset! state {:route "/womp"})
  (reset! state {:route "/"})
  (swap! state update :route (constantly "/from-const")))

(defn omit-keys
  [coll xs]
  (assert (map? coll) "omit-keys only operates on maps")
  (let [excluded-keys (set xs)]
    (->> coll
         (filter (fn [[k _]]
                   (not (excluded-keys k))))
         (into {}))))

(comment
  (omit-keys {:a true :b false} [:a :c]))

(defn user->name
  [user]
  (let [name (join " " [(:givenName user) (:familyName user)])]
    (if-not (empty? name)
      name
      "<Unknown>")))

(defn Link
  [props & children]
  (let [handle-click (fn [e]
                       (.preventDefault e)
                       (swap! state update :route (constantly (click->href e))))
        active? (fn [href]
                  (if (:exact props)
                    (= (:route @state) href)
                    (starts-with? (:route @state) href)))]
    (fn [props & children]
      [:a (merge {:on-click handle-click
                  :class (if (active? (:href props)) "active")}
                 (omit-keys props [:exact])) children])))

(let [a (for [user (gen/sample (spec/gen ::user))]
          (:id user))
      b (map :id (gen/sample (spec/gen ::user)))]
  (println (= a b)))

;; (defn fetch-users
;;   []
;;   (for [user (gen/sample (spec/gen ::user))] user))

(defn index-by
  [xs k]
  (->> xs
       (reduce
        (fn [agg m] (assoc agg (get m k) m))
        {})))

(comment
    (index-by [{:id "wee" :name "jubles"} {:id "sup" :name "HOO"}] :id))

(def heyhey (atom nil))

(-> @heyhey (->> (take 2)) (index-by "uuid"))
(-> @state :users vals)

(defn fetch-users
  []
  (-> axios
      (.get (->url "/users") request-headers)
      (.then #(-> % .-data))
      (.then (fn [x]
               (aset js/window "_data" x)
               (reset! heyhey (js->clj x))
               (swap! state update :users #(-> x
                                               js->clj
                                               (->> (map keywordize-keys))
                                               (index-by :uuid)))))
      (.catch #(println "Got an error!" %))))

(comment (fetch-users))
(comment
  (-> @state :users type)
  (-> @state :users vals (->> (map keywordize-keys) (take 10)))
  (-> @state :users vals (->> (map keywordize-keys)) first user->name))

;; TODO FIX DATA Mapping!!
(defn Users
  ([] [Users (-> @state :users vals)])
  ([users]
   (if (empty? users)
     [:div.users "No users :("]
     [:div.users
      [:h1 "Users"]
      [:p "A list of users can go here"]
      [:> bp/Button {:on-click #(println "should fetch")} "Fetch Users"]
      [:div.config
       [:h3 [:strong "NODE_ENV="] [:span {:style {:color "red"}} NODE_ENV]]
       [:h3 [:strong "ADMIN_TOKEN="] [:span {:style {:color "red"}} ADMIN_TOKEN]]]
      [:div.user-list
       (for [u (->> users (map keywordize-keys))]
         [:div
          {:key (:uuid u)}
          [:p [:strong "id:"] " " (-> u :uuid str)]
          [:p [:string "name:"] " " (user->name u)]
          [:p [:string "email:"] " " (:email u)]
          [Link {:href (str "users/" (:uuid u))} "View"]])]])))

(defn route->id [route] (second (re-matches #"/users/([\w-]+)" route)))

(-> @state :route route->id)

(let [id (route->id (:route @state))
        user (-> @state :users (keyword id))
        _ (-> @state :users (keyword  "3e212705-a76e-4f87-8fe8-3028878d7906") )]
    user)

(->> @state :users (take 2))

(defn UserDetails
  []
  (let [id (route->id (:route @state))
        user (-> @state :users (get id))
        _ (-> @state :users (get  "3e212705-a76e-4f87-8fe8-3028878d7906"))]
    (if-not id
      [:div [:h1 "User Not Found"] [:p "No user found for id."]]
      (do
        (aset js/window "usr" (clj->js user))
        [:div
          [:h1 "User Details"]
          [:p [:string "id: "] id]
         [:p [:string "name: "] (user->name user)]
         [:p [:string "email: "]
          [:a {:href (str "mailto:" (:email user))} (:email user)]]
         ]))))

(defn Home
  []
  [:div.home
   [:h1 "You're on the home page"]
   [:> bp/Button {:intent "success" :on-click #(println "sup")} "did it"]
   [:p "We made it"]])

(defn About
  []
  [:div.about
   [:h1 "All about us"]
   [:p "Yay"]])

(defn NotFound
  []
  [:div
   {:style {:text-align "center"}}
   [:h1 "Nothing to see here"]
   [:p "We hit a 404"]])

(defn Header []
  [:nav.flex.Header
   [Link {:href "/" :exact true} "Users"]
   [Link {:href "/about"} "About"]
   [Link {:href "/hello"} "Hello"]
   [:div.right
    {:style {:min-width 200}}
    [:p (str "Current Page: " (:route @state))]]])

(defn App
  []
  (let [_ (app-init)
        _ (fetch-users)]
    (fn []
      [:div.main
       {:class "merge-class"} ;; Just showing myself that classes will be merged
       [Header]
       [:hr]
       (if (empty? ADMIN_TOKEN)
         [:div.no-auth
          [:h1 "No ADMIN_TOKEN found"]
          [:p
           "The app could not find " [:code "ADMIN_TOKEN"]
           " in your local environment. Without this token we have no way of
           authenticating with the server."]])
       [:div.routed
        (let [route (:route @state)]
          (cond
            (= route "/") [Users]
            (route->id route) [UserDetails]
            (= route "/about") [About]
            (= route "/hello") [hello]
            :else [NotFound]))]])))

(defn ^:dev/after-load render
  "Render the toplevel component for this app."
  []
  (r/render [App] (.getElementById js/document "app")))

(defn ^:export main
  "Run application startup logic."
  []
  (render))
