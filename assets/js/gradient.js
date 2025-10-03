
import { Gradient } from './stripe.gradient.js';

const gradient = new Gradient();
const COLORS = [
    "#242424", "#282828", "#000000", "#1f1f1f" // typo with 282828FF made a cool blue
];

document.addEventListener("DOMContentLoaded", function () {
    gradient.initGradient("#" + "mesh-canvas", COLORS);

    var x = 0;
    setInterval(function () {
        gradient?.changePosition(x);
        x += 0.01;
    }, 10); // 250 milliseconds = 0.25 seconds

});
