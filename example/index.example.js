import Scrolling from '../dist/index.js';

const scrolling = new Scrolling({ debug: true });
scrolling.addTrigger({
    name: 'Intro',
    trigger: document.getElementById('intro-container'),
    steps: [
        {
            name: 'Scale up',
            element: document.querySelector('h1'),
            offset: 0,
            duration: 30,
            change: {
                transform: {
                    from: 'scale(1)',
                    to: 'scale(20)',
                },
            },
        },
        {
            name: 'Blur',
            element: document.querySelector('h1'),
            offset: 5,
            duration: 25,
            change: {
                filter: {
                    from: 'blur(0px)',
                    to: 'blur(10px)',
                },
            },
        },
        {
            name: 'Fade out',
            element: document.querySelector('h1'),
            offset: 30,
            duration: 30,
            change: {
                opacity: {
                    from: 1,
                    to: 0,
                },
            },
        },
    ],
});

const example1 = document.getElementById('example1-title');
scrolling.addTrigger({
    name: 'Example 1',
    trigger: document.getElementById('example1-container'),
    steps: [
        {
            name: 'Fade In',
            element: example1,
            offset: 10,
            duration: 10,
            change: {
                opacity: {
                    from: 0,
                    to: 1,
                },
            },
        },
        {
            name: 'Fade out',
            element: example1,
            offset: 90,
            duration: 10,
            change: {
                opacity: {
                    from: 1,
                    to: 0,
                },
            },
        },
    ],
});
const example2 = document.getElementById('example2-title');
scrolling.addTrigger({
    name: 'Example 2',
    trigger: document.getElementById('example2-container'),
    steps: [
        {
            name: 'Appear',
            element: example2,
            offset: 30,
            duration: 20,
            change: {
                opacity: {
                    from: 0,
                    to: 1,
                },
            },
        },
    ],
});

const example3 = document.getElementById('example3-title');
scrolling.addTrigger({
    name: 'Example 3',
    trigger: document.getElementById('example3-container'),
    steps: [
        {
            name: 'Rotate appear',
            element: example3,
            offset: 0,
            duration: 60,
            change: {
                opacity: {
                    from: 0,
                    to: 1,
                },
            },
        },
        {
            name: 'Rotate appear',
            element: example3,
            offset: 10,
            duration: 40,
            change: {
                transform: {
                    from: 'rotate(0deg)',
                    to: 'rotate(-360deg)',
                },
            },
        },
    ],
});
