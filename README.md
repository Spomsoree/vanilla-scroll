# Vanilla Scroll

A lightweight JavaScript library for creating scroll-based animations with minimal configuration.

[View Demo](https://vanilla-scroll.spomsoree.dev)

## Features

- Trigger animations based on element visibility in the viewport
- Chain multiple animation steps with precise timing control
- Support for multiple CSS properties (opacity, transform, filter, etc.)
- Simple fluent API for creating complex scroll animations
- Debug mode with visual timeline for development

## Installation

```bash
npm install @spomsoree/vanilla-scroll
```

## Basic Usage

```javascript
import VanillaScroll from 'vanilla-scroll.js';

// Initialize the library
const vs = new VanillaScroll({ debug: false });

// Configure your animations
vs.addTrigger({
    name: 'My Animation',
    trigger: document.getElementById('my-container'),
    steps: [
        {
            name: 'Fade In',
            element: document.querySelector('.my-element'),
            offset: 0,
            duration: 20,
            change: {
                opacity: {
                    from: 0,
                    to: 1
                }
            }
        }
    ]
}).build();
```

## Core Concepts

### Triggers

A trigger defines when animations should start playing. Each trigger is attached to a DOM element (the "trigger element") and will activate when that element enters the viewport.

### Steps

Each trigger can contain multiple animation steps. Steps define:
- Which element to animate
- What properties to change
- How long the animation should take
- When the animation should start (relative to the trigger)

## Configuration Options

### Initializing the Library

```javascript
const vs = new VanillaScroll({
    debug: true  // Enable debug mode with visual timeline for development
});
```

### Adding Triggers

```javascript
vs.addTrigger({
    name: 'String',       // Name for debugging purposes
    trigger: DOMElement,  // Element that triggers the animation
    steps: [...]          // Array of animation steps
});
```

### Animation Steps

```javascript
{
    name: 'String',       // Name for debugging purposes
    element: DOMElement,  // Element to animate
    offset: Number,       // Offset to start animation (percentage of viewport)
    duration: Number,     // Duration of animation (percentage of viewport)
    change: {             // CSS properties to animate
        property: {
            from: Value,
            to: Value
        }
    }
}
```

## Advanced Example

```javascript
vs.addTrigger({
    name: 'Header Animation',
    trigger: document.getElementById('header-container'),
    steps: [
        // Scale up the headline as user scrolls
        {
            name: 'Scale Up',
            element: document.querySelector('h1'),
            offset: 0,    // Start immediately when trigger enters viewport
            duration: 10, // Animation takes 10% of viewport height to complete
            change: {
                transform: {
                    from: 'scale(1)',
                    to: 'scale(1.5)'
                }
            }
        },
        // Fade out the headline with delay
        {
            name: 'Fade Out',
            element: document.querySelector('h1'),
            offset: 15,   // Start after scrolling 15% of viewport height
            duration: 10,
            change: {
                opacity: {
                    from: 1,
                    to: 0
                }
            }
        }
    ]
}).build();  // Don't forget to call build() when finished!
```

## Chaining

The library uses a fluent API allowing you to chain multiple triggers:

```javascript
vs
    .addTrigger({ /* first trigger */ })
    .addTrigger({ /* second trigger */ })
    .addTrigger({ /* third trigger */ })
    .build();
```

## Supported Properties

You can animate any CSS property that accepts numeric values or transform functions:

- `opacity`: Numbers between 0 and 1
- `transform`: Strings like 'scale(1)', 'rotate(90deg)', etc.
- `filter`: Strings like 'blur(10px)', 'brightness(150%)', etc.
- And many more!

## Debug Mode

When enabled with `debug: true`, vanilla-scroll.js displays a visual timeline showing:

- All triggers as horizontal containers
- Animation steps as colored rectangles within each trigger
- Timing relationships between steps (offsets and durations)
- Current scroll position indicators

This visualization helps you understand how animations are sequenced and overlap as users scroll through your page.

## License

MIT