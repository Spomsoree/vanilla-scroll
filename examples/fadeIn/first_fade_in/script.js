import VanillaScroll from '../../../src/vanilla-scroll.js';

const scrolling = new VanillaScroll({ debug: true });
const container = document.getElementById('first-container');
const headline = container.querySelector('h2');

scrolling
    .addTrigger({
        name: 'First',
        trigger: container,
        steps: [
            {
                name: 'Fade In',
                element: headline,
                offset: -10,
                duration: 7,
                changes: {
                    opacity: {
                        from: 0,
                        to: 1,
                    },
                },
            },
        ],
    })
    .build();
