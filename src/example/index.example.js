import VanillaScroll from './vanilla-scroll.js';

const scrolling = new VanillaScroll({ debug: true });
const headline  = document.querySelector('h1');
const example1  = document.getElementById('example1-title');
const example2  = document.getElementById('example2-title');
const example3  = document.getElementById('example3-title');

scrolling.addTrigger({
    name:    'Intro',
    trigger: document.getElementById('intro-container'),
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
}).addTrigger({
    name:    'Example 1',
    trigger: document.getElementById('example1-container'),
    steps:   [
        {
            name:     'Fade In',
            element:  example1,
            offset:   0,
            duration: 20,
            change:   {
                opacity: {
                    from: 0,
                    to:   1,
                },
            },
        },
        {
            name:     'Fade out',
            element:  example1,
            offset:   40,
            duration: 20,
            change:   {
                opacity: {
                    from: 1,
                    to:   0,
                },
            },
        },
    ],
}).addTrigger({
    name:    'Example 2',
    trigger: document.getElementById('example2-container'),
    steps:   [
        {
            name:     'Appear',
            element:  example2,
            offset:   -10,
            duration: 20,
            change:   {
                opacity: {
                    from: 0,
                    to:   1,
                },
            },
        },
        {
            name:     'Disappear',
            element:  example2,
            offset:   30,
            duration: 10,
            change:   {
                opacity: {
                    from: 1,
                    to:   0,
                },
            },
        },
    ],
}).addTrigger({
    name:    'Example 3',
    trigger: document.getElementById('example3-container'),
    steps:   [
        {
            name:     'Rotate',
            element:  example3,
            offset:   -10,
            duration: 10,
            change:   {
                transform: {
                    from: 'rotate(0deg)',
                    to:   'rotate(-360deg)',
                },
            },
        },
        {
            name:     'Appear',
            element:  example3,
            offset:   -10,
            duration: 20,
            change:   {
                opacity: {
                    from: 0,
                    to:   .5,
                },
            },
        },
        {
            name:     'Appear 2',
            element:  example3,
            offset:   10,
            duration: 7,
            change:   {
                opacity: {
                    from: .5,
                    to:   1,
                },
            },
        },
    ],
}).build();
