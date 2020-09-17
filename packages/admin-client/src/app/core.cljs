(ns app.core
  "This namespace contains your application and is the entrypoint for 'yarn start'."
  (:require [reagent.core :as r]
            [clojure.string :refer [starts-with?]]
            [clojure.spec.alpha :as spec]
            [clojure.spec.gen.alpha :as gen]
            [clojure.test.check.generators]
            ["@blueprintjs/core" :as bp]
            [app.hello :refer [hello]]))

;; Generate emails. They are all at gmamil.com, but i'm not sure how to combine
;; multiple string generators yet
(def string-alnum-gen (gen/such-that #(and (not= % "") (> (count %) 5)) (gen/string-alphanumeric)))
(def email-host-gen (spec/gen #{"gmail.com" "hotmail.com" "yahoo.com.tw" "protonmail.com" "fastmail.io"}))

;; NOTE Spec or requires a keyword along with the predicate to help identify
;; which test failed. Not sure why spec/and doesn't require this though
;; (spec/def ::email (spec/or :string string? :nil nil?))
;; NOTE Use the nilable helper rather than or if you just want nilable values
(spec/def ::email
  (spec/with-gen
    (spec/and string?
              #(re-matches #"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$" %))
    #(gen/fmap (fn [[a b]] (str a "@" b))
               (gen/tuple string-alnum-gen email-host-gen))))

(spec/def ::name (spec/nilable string?))
(spec/def ::user (spec/keys :req-un [::email ::name]))

(comment
  (gen/sample (gen/tuple string-alnum-gen email-host-gen))
  (spec/valid? string? "")
  (spec/valid? nil? "hey")

  (spec/valid? ::user {:name "Ian" :email "mail@mail.com"})

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
  (let [defaults {:route "/"}]
    (merge defaults overrides)))

(def state (r/atom (get-initial-state)))

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

(defn app-init
  "Initialize the App. Run one-time setup."
  []
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
   [Link {:href "/" :exact true} "Home"]
   [Link {:href "/about"} "About"]
   [Link {:href "/hello"} "Hello"]
   [:div.right
    {:style {:min-width 200}}
    [:p (str "Current Page: " (:route @state))]]])

(defn App
  []
  (app-init)
  (fn []
    [:div.main
     {:class "merge-class"} ;; Just showing myself that classes will be merged
     [Header]
     [:hr]
     [:div.routed
      (case (:route @state)
        "/" [Home]
        "/about" [About]
        "/hello" [hello]
        [NotFound])]]))

(defn ^:dev/after-load render
  "Render the toplevel component for this app."
  []
  (r/render [App] (.getElementById js/document "app")))

(defn ^:export main
  "Run application startup logic."
  []
  (render))
