import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const debug = require("debug")("client:ScrollToTop");

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    debug("Scrolling to 0,0");
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
