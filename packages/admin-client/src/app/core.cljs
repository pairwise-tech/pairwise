(ns app.core
  "This namespace contains your application and is the entrypoint for 'yarn start'."
  (:require-macros [clojure.core.async :refer [go go-loop]])
  (:require [reagent.core :as r]
            [clojure.core.async :as async :refer [>! <! chan]]
            [clojure.string :refer [starts-with?]]
            [clojure.spec.alpha :as spec]
            [clojure.spec.gen.alpha :as gen]
            [clojure.test.check.generators]
            [ajax.core :as ajax]
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


(spec/def ::guid uuid?)
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
(spec/def ::user (spec/keys :req-un [::guid ::email ::name]))

(comment
  (gen/sample (gen/tuple string-alnum-gen email-host-gen))
  (spec/valid? string? "")
  (spec/valid? nil? "hey")

  ;; Hm, not actually sure what a uuid is
  (spec/valid? ::user {:guid (uuid "3f716909-e631-4458-b820-6a46cf5113b0") :name "Ian" :email "mail@mail.com"})

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
  (let [defaults {:route "/"
                  :users {}}]
    (merge defaults overrides)))

(def state (r/atom (get-initial-state)))

;; FIXME This should be behind a flag probably. Just for debugging
;; NOTE You CANNOT use "app" as the key on window. It breaks _EVERYTHING_. That's unfortunate
(aset js/window "pw" #js{:getState #(clj->js @state)})

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
  #_(println "State just changed!" prev-state next-state)
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

(defn fetch-users
  []
  (for [user (gen/sample (spec/gen ::user))] user))

(defn list->resource-map
  [xs derive-key]
  (->> xs
       (reduce (fn [agg, x] (conj agg {(derive-key x) x})) {})))

(comment
  (let [a (for [user (gen/sample (spec/gen ::user))]
            (:guid user))
        b (map :guid (gen/sample (spec/gen ::user)))]
    (println (= a b)))

  (let [xs (gen/sample (spec/gen ::user) 3)]
    (-> xs
        (list->resource-map :guid)
        (count))))

(defn store-users!
  [users])

(comment (fetch-users))

(defn Users
  ([] [Users (get @state :users [])])
  ([users]
   (assert (map? users) "Users component must be passed a map")
   (if (empty? users)
     [:div.users "No users :("]
     [:div.users
      [:h1 "Users"]
      [:p "A list of users can go here"]
      [:> bp/Button {:on-click #(println "should fetch")} "Fetch Users"]
      [:div.user-list
       (for [u (vals users)]
         [:div
          {:key (:guid u)}
          [:p [:strong "guid:"] " " (-> u :guid str)]
          [:p [:string "name:"] " " (or (:name u) "<Unknown>")]
          [:p [:string "email:"] " " (:email u)]
          [Link {:href (str "users/" (:guid u))} "View"]])]])))

(defn route->guid [route] (second (re-matches #"/users/([\w-]+)" route)))

(defn UserDetails
  []
  (let [guid (route->guid (:route @state))
        user (get (:users @state) (uuid guid))] ;; FIXME Having to convert the string guid to a uuid is pretty confusing. Should probably just use strings
    (if-not user
      [:div [:h1 "User Not Found"] [:p "No user found for guid."]]
      [:div
       [:h1 "User Details"]
       [:p [:string "guid: "] guid]
       [:p [:string "name: "] (:name user)]
       [:p [:string "email: "] (:email user)]])))

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
        _ (go (let [users (fetch-users)]
                (swap! state update :users merge (list->resource-map users :guid))))]
    (fn []
      [:div.main
       {:class "merge-class"} ;; Just showing myself that classes will be merged
       [Header]
       [:hr]
       [:div.routed
        (let [route (:route @state)]
          (cond
            (= route "/") [Users]
            (route->guid route) [UserDetails]
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
