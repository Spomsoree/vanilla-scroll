import VanillaScroll from '../../../src/vanilla-scroll.js';

const scrolling = new VanillaScroll({ debug: true });
const container = document.getElementById('intro-container');
const container1 = document.getElementById('example1-container');
const container2 = document.getElementById('example2-container');
const container3 = document.getElementById('example3-container');
const headline = document.querySelector('h1');
const example1 = document.getElementById('example1-title');
const example2 = document.getElementById('example2-title');
const example3 = document.getElementById('example3-title');

scrolling
    .addTrigger({
        name: 'Intro',
        trigger: container,
        steps: [
            {
                name: 'Scale up',
                element: headline,
                offset: 0,
                duration: 10,
                changes: {
                    transform: {
                        from: 'scale(1)',
                        to: 'scale(20)',
                    },
                },
            },
            {
                name: 'Blur',
                element: headline,
                offset: 3,
                duration: 10,
                changes: {
                    filter: {
                        from: 'blur(0px)',
                        to: 'blur(10px)',
                    },
                },
            },
            {
                name: 'Fade out',
                element: headline,
                offset: 8,
                duration: 8,
                changes: {
                    opacity: {
                        from: 1,
                        to: 0,
                    },
                },
            },
        ],
    })
    .addTrigger({
        name: 'Example 1',
        trigger: container1,
        steps: [
            {
                name: 'Fade In',
                element: example1,
                offset: 0,
                duration: 20,
                changes: {
                    opacity: {
                        from: 0,
                        to: 1,
                    },
                },
            },
            {
                name: 'Active',
                element: example1,
                offset: 20,
                duration: 20,
                onEnter: (event) => {
                    event.detail.element.classList.add('active');
                },
                onExit: (event) => {
                    event.detail.element.classList.remove('active');
                },
            },
            {
                name: 'Fade out',
                element: example1,
                offset: 40,
                duration: 20,
                changes: {
                    opacity: {
                        from: 1,
                        to: 0,
                    },
                },
            },
        ],
    })
    .addTrigger({
        name: 'Example 2',
        trigger: container2,
        steps: [
            {
                name: 'Appear',
                element: example2,
                offset: -10,
                duration: 20,
                changes: {
                    opacity: {
                        from: 0,
                        to: 1,
                    },
                },
            },
            {
                name: 'Disappear',
                element: example2,
                offset: 30,
                duration: 10,
                changes: {
                    opacity: {
                        from: 1,
                        to: 0,
                    },
                },
            },
        ],
    })
    .addTrigger({
        name: 'Example 3',
        trigger: container3,
        steps: [
            {
                name: 'Rotate',
                element: example3,
                offset: -10,
                duration: 10,
                changes: {
                    transform: {
                        from: 'rotate(0deg)',
                        to: 'rotate(-360deg)',
                    },
                },
            },
            {
                name: 'Appear',
                element: example3,
                offset: -10,
                duration: 20,
                changes: {
                    opacity: {
                        from: 0,
                        to: .5,
                    },
                },
            },
            {
                name: 'Appear 2',
                element: example3,
                offset: 10,
                duration: 7,
                changes: {
                    opacity: {
                        from: .5,
                        to: 1,
                    },
                },
            },
        ],
    })
    .build();
