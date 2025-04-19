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
                name: 'Border Top Grow',
                element: headline,
                offset: 0,
                duration: 4,
                changes: {
                    borderTopWidth: {
                        from: '1px',
                        to: '20px',
                    },
                    borderBottomWidth: {
                        from: '20px',
                        to: '1px',
                    },
                },
            },
            {
                name: 'Border Bottom Grow',
                element: headline,
                offset: 4,
                duration: 4,
                changes: {
                    borderTopWidth: {
                        from: '20px',
                        to: '1px',
                    },
                    borderBottomWidth: {
                        from: '1px',
                        to: '20px',
                    },
                },
            },
            {
                name: 'Border Top Grow',
                element: headline,
                offset: 8,
                duration: 4,
                changes: {
                    borderTopWidth: {
                        from: '1px',
                        to: '20px',
                    },
                    borderBottomWidth: {
                        from: '20px',
                        to: '1px',
                    },
                },
            },
            {
                name: 'Border Bottom Grow',
                element: headline,
                offset: 12,
                duration: 4,
                changes: {
                    borderTopWidth: {
                        from: '20px',
                        to: '1px',
                    },
                    borderBottomWidth: {
                        from: '1px',
                        to: '20px',
                    },
                },
            },
            {
                name: 'Border Top Grow',
                element: headline,
                offset: 16,
                duration: 4,
                changes: {
                    borderTopWidth: {
                        from: '1px',
                        to: '20px',
                    },
                    borderBottomWidth: {
                        from: '20px',
                        to: '1px',
                    },
                },
            },
            {
                name: 'Border Bottom Grow',
                element: headline,
                offset: 20,
                duration: 4,
                changes: {
                    borderTopWidth: {
                        from: '20px',
                        to: '1px',
                    },
                    borderBottomWidth: {
                        from: '1px',
                        to: '20px',
                    },
                },
            },
            {
                name: 'Border Top Grow',
                element: headline,
                offset: 24,
                duration: 4,
                changes: {
                    borderTopWidth: {
                        from: '1px',
                        to: '20px',
                    },
                    borderBottomWidth: {
                        from: '20px',
                        to: '1px',
                    },
                },
            },
            {
                name: 'Border Bottom Grow',
                element: headline,
                offset: 28,
                duration: 4,
                changes: {
                    borderTopWidth: {
                        from: '20px',
                        to: '1px',
                    },
                    borderBottomWidth: {
                        from: '1px',
                        to: '20px',
                    },
                },
            },
        ],
    })
    .build();
