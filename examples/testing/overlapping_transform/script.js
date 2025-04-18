import VanillaScroll from '../../../src/vanilla-scroll.js';

const scrolling = new VanillaScroll({ debug: true });
const container = document.getElementById('intro-container');
const headline = document.querySelector('h1');

scrolling
    .addTrigger({
        name: 'Intro',
        trigger: container,
        steps: [
            {
                name: 'Rotate',
                element: headline,
                offset: 1,
                duration: 7,
                changes: {
                    transform: {
                        from: 'rotate(0)',
                        to: 'rotate(45deg)',
                    },
                },
            },
            {
                name: 'Multi mix transform',
                element: headline,
                offset: 3,
                duration: 10,
                changes: {
                    transform: {
                        from: 'scale(0) translateY(0)',
                        to: 'translateY(50%) scale(20)',
                    },
                },
            },
        ],
    })
    .build();
