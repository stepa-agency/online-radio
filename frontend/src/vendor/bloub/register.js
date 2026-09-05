// Vendored from https://github.com/jeremy-prt/bloub (MIT). BloubBot.vue and
// src/bot/** are copied close to verbatim (import paths made relative, and
// the one i18n-only aria-label call replaced with a static string — see
// BloubBot.vue for that edit). Compiled here into a plain custom element so
// the rest of this app, which is React, can use it as a normal <bloub-bot>
// tag without depending on Vue anywhere else.
import { defineCustomElement } from "vue";
import BloubBot from "./BloubBot.vue";

if (!customElements.get("bloub-bot")) {
  customElements.define("bloub-bot", defineCustomElement(BloubBot));
}
