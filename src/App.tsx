// @ts-nocheck
import React from "react";
import { Redirect, Route } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Toaster } from "react-hot-toast";

import Tab1 from "./pages/Tab1";
import Tab2 from "./pages/Tab2";
import Tab3 from "./pages/Tab3";
import Tab4 from "./pages/Tab4";

import { SolanaProvider } from "./context/SolanaContext";
import { PrivyProvider } from "./context/PrivyContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NavBar } from "antd-mobile";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";
import MainPage from "./pages/MainPage/MainPage";
import CreateMemePage from "./pages/CreatePage/CreateMemePage";

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <PrivyProvider>
      <SolanaProvider>
        <IonReactRouter>
          <ThemeProvider>
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            <IonRouterOutlet>
              <Route path="/main">
                <MainPage />
              </Route>
              <Route path="/create">
                <CreateMemePage />
              </Route>
              <Route exact path="/tab1">
                <Tab1 />
              </Route>
              <Route exact path="/tab2">
                <Tab2 />
              </Route>
              <Route path="/tab3">
                <Tab3 />
              </Route>
              <Route path="/tab4">
                <Tab4 />
              </Route>
              <Route exact path="/">
                <Redirect to="/main" />
              </Route>
            </IonRouterOutlet>
          </ThemeProvider>
        </IonReactRouter>
      </SolanaProvider>
    </PrivyProvider>
  </IonApp>
);

// @ts-ignore
export default App;
