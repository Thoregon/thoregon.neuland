import { v4 } from "../uuid/index.js";

function defaultFactory() {
    return v4().replace(/-/g, "");
}
let factory = defaultFactory;
export const uuid = () => {
    return factory();
};
uuid.setFactory = newFactory => {
    factory = newFactory;
};
uuid.reset = () => {
    factory = defaultFactory;
};
