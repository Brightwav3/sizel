import React from "react";
// ADR 0005: the entrypoint imports the application composition boundary.
// docs/decisions/0005-feature-first-source-layout.md
import { createRoot } from "react-dom/client";
import "./shared/styles/icons.css";
import "./_ds/rigsmith-design-system-7950386b-2f59-40a2-bfcc-93f7f795acfe/tokens/colors.css";
import "./_ds/rigsmith-design-system-7950386b-2f59-40a2-bfcc-93f7f795acfe/tokens/typography.css";
import "./_ds/rigsmith-design-system-7950386b-2f59-40a2-bfcc-93f7f795acfe/tokens/spacing.css";
import "./_ds/rigsmith-design-system-7950386b-2f59-40a2-bfcc-93f7f795acfe/tokens/radii.css";
import "./_ds/rigsmith-design-system-7950386b-2f59-40a2-bfcc-93f7f795acfe/tokens/shadows.css";
import "./_ds/rigsmith-design-system-7950386b-2f59-40a2-bfcc-93f7f795acfe/tokens/fonts.css";
import { RigsmithApp } from "./app";

createRoot(document.getElementById("root")!).render(<React.StrictMode><RigsmithApp /></React.StrictMode>);
