import Scrolling from "../dist/index.js";

const scrolling = new Scrolling();
        scrolling.addTrigger({
            name: "Intro",
            trigger: document.getElementById("intro-container"),
            steps: [{
                name: "Scale",
                element: document.querySelector("h1"),
                offset: 0,
                duration: 30,
                change: {
                    transform: {
                        from: "scale(1)",
                        to: "scale(20)"
                    }
                }
            }, {
                name: "Blur",
                element: document.querySelector("h1"),
                offset: 20,
                duration: 10,
                change: {
                    filter: {
                        from: "blur(0px)",
                        to: "blur(10px)"
                    }
                }
            }, {
                name: "Opacity",
                element: document.querySelector("h1"),
                offset: 30,
                duration: 30,
                change: {
                    opacity: {
                        from: 1,
                        to: 0
                    }
                }
            }]
        });