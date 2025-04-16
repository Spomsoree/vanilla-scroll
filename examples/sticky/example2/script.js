import VanillaScroll from '../../../src/vanilla-scroll.js';

const scrolling = new VanillaScroll({ debug: true });
const container = document.getElementById('intro-container');

scrolling
    .addTrigger({
        name:    'Intro',
        trigger: container,
    })
    .build();
