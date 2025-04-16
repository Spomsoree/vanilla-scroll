import VanillaScroll from '../../../src/vanilla-scroll.js';

const scrolling = new VanillaScroll({ debug: true });
const container = document.getElementById('intro-container');
const headline = document.querySelector('h1');

scrolling
    .addTrigger({
        name:    'Intro',
        trigger: container,
        steps:   [
            {
                name:     'Scale up',
                element:  headline,
                offset:   0,
                duration: 10,
                change:   {
                    transform: {
                        from: 'scale(1)',
                        to:   'scale(20)',
                    },
                },
            },
            {
                name:     'Blur',
                element:  headline,
                offset:   3,
                duration: 10,
                change:   {
                    filter: {
                        from: 'blur(0px)',
                        to:   'blur(10px)',
                    },
                },
            },
            {
                name:     'Fade out',
                element:  headline,
                offset:   8,
                duration: 8,
                change:   {
                    opacity: {
                        from: 1,
                        to:   0,
                    },
                },
            },
        ],
    })
    .build();
