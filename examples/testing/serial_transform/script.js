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
                name: 'Scale up',
                element: headline,
                offset: 0,
                duration: 16,
                changes: {
                    transform: {
                        from: 'scale(1)',
                        to: 'scale(20)',
                    },
                },
            },
            {
                name: 'Scale down',
                element: headline,
                offset: 16,
                duration: 16,
                changes: {
                    transform: {
                        from: 'scale(20)',
                        to: 'scale(1)',
                    },
                },
            },
        ],
    })
    .build();
