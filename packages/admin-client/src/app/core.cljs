(ns app.core
  "This namespace contains your application and is the entrypoint for 'yarn start'."
  (:require [reagent.core :as r]
            ["@blueprintjs/core" :as bp]
            [app.hello :refer [hello]]))

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

(defn Link
  [props & children]
  (let [handle-click (fn [e]
                       (.preventDefault e)
                       (swap! state update :route (constantly (click->href e))))]
    (fn [props & children]
      [:a (merge {:on-click handle-click
                  :class (if (= (:href props) (:route @state)) "active")}
                 props) children])))

(defn Home
  []
  [:div.home
   [:h1 "You're on the home page"]
   [:> bp/Button {:intent "primary" :on-click #(println "sup")} "did it"]
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
   [Link {:href "/"} "Home"]
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
     {:class "merge-class"}
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
