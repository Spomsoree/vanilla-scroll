import {
    IndicatorType,
    GOLDEN_ANGLE,
    DEGREES_IN_CIRCLE,
    DEBUG_COLOR_SATURATION,
    DEBUG_COLOR_LIGHTNESS,
} from './constants.js';
import { parseStringChanges, reconstructValue } from './parser.js';
import { CssGenerator } from './css-generator.js';
import { DebugVisualizer } from './debug-visualizer.js';

class VanillaScroll {
    #handlers;

    constructor(options) {
        this.debug            = options?.debug;
        this.steps            = [];
        this.nodes            = [];
        this.triggers         = [];
        this.percentage       = 0;
        this.scrollTop        = 0;
        this.scrollHeight     = 0;
        this.clientHeight     = 0;
        this.animationFrame   = null;
        this.useCssAnimations = this.supportsCssScrollAnimations();
        this.stepsWithEvents  = [];
        this.cssGenerator     = null;
        this.debugVisualizer  = this.debug ? new DebugVisualizer() : null;

        this.#handlers = {
            scroll:       () => this.onScroll(),
            resize:       () => this.onResize(),
            scrollEvents: () => this.onScrollEvents(),
        };

        this.start();
    }

    supportsCssScrollAnimations() {
        try {
            return CSS.supports('animation-timeline', 'scroll()');
        } catch {
            return false;
        }
    }

    getEvent(type, step) {
        return new CustomEvent(type, {
            detail: { element: this.nodes[step.nodeId] },
        });
    }

    sendEvents(didEnter) {
        return (step) => {
            if (didEnter && !step.enterCache) {
                step.enterCache = true;
                if (typeof step.onEnter === 'function') {
                    step.onEnter(this.getEvent('didEnter', step));
                }
            } else if (!didEnter && step.enterCache) {
                step.enterCache = false;
                if (typeof step.onExit === 'function') {
                    step.onExit(this.getEvent('didExit', step));
                }
            }
            return null;
        };
    }

    calculateInRangeSteps(values, step) {
        const range          = step.end - step.start;
        const progressFactor = range > 0 ? (this.percentage - step.start) / range : 0;

        return values.from + ((values.to - values.from) * progressFactor);
    }

    calculateTick(step, styleChanges, calculationFunction, eventFunction) {
        const parsedChanges = step.parsedChanges;

        eventFunction(step);

        if (!parsedChanges) {
            return;
        }

        Object.entries(parsedChanges).forEach(([key, parsed]) => {
            const cssKey                 = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
            const { template, from, to } = parsed;
            const interpolatedValues     = [];

            from.forEach((fromValue, index) => {
                const toValue      = to[index];
                const interpolated = calculationFunction({ from: fromValue.value, to: toValue.value }, step);
                interpolatedValues.push({ value: interpolated, unit: fromValue.unit });
            });

            styleChanges[cssKey] = { template, values: interpolatedValues };
        });

        return styleChanges;
    }

    calculateStep(step, styleChanges, initially = false) {
        const percentage = this.getActivePercentage();

        if (
            !initially &&
            !step.lastTickInRange &&
            !step.lastTickInAfterRange &&
            (percentage < step.start || percentage > step.end)
        ) {
            return styleChanges;
        }

        if (percentage >= step.start && percentage <= step.end) {
            step.lastTickInRange      = true;
            step.lastTickInAfterRange = false;

            return this.calculateTick(
                step,
                styleChanges,
                (values, step) => this.calculateInRangeSteps(values, step),
                this.sendEvents(true)
            );
        } else if (initially || step.lastTickInRange || step.lastTickInAfterRange) {
            step.lastTickInRange = false;

            if (percentage > step.end) {
                step.lastTickInAfterRange = true;
                return this.calculateTick(step, styleChanges, (values) => values.to, this.sendEvents(false));
            }

            if (percentage < step.start && (!initially || step.lastTickInAfterRange)) {
                step.lastTickInAfterRange = false;
                return this.calculateTick(step, styleChanges, (values) => values.from, this.sendEvents(false));
            }
        }

        return styleChanges;
    }

    calculateSteps() {
        const nodeStyleChanges = {};

        this.steps.forEach(step => {
            nodeStyleChanges[step.nodeId] = this.calculateStep(step, nodeStyleChanges[step.nodeId] ?? {});
        });

        Object.entries(nodeStyleChanges).forEach(([nodeId, nodeStyleChange]) => {
            this.nodes[nodeId].style = Object.entries(nodeStyleChange).map(([property, data]) => {
                const stringValue = reconstructValue(data.template, data.values);
                return `${property}:${stringValue};`;
            }).join('');
        });
    }

    calculatePercentage() {
        const newScrollY    = document.documentElement.scrollTop;
        this.percentage     = this.scrollHeight > 0 ? (newScrollY + this.scrollTop) / this.scrollHeight : 0;
        this.animationFrame = requestAnimationFrame(() => {
            this.calculateSteps();
            this.debugVisualizer?.updateCurrentPosition(
                this.percentage,
                this.scrollTop,
                this.scrollHeight,
                this.clientHeight
            );
        });
    }

    calculateBounds() {
        this.scrollTop    = document.body.scrollTop;
        this.scrollHeight = document.documentElement.scrollHeight;
        this.clientHeight = window.innerHeight;

        this.calculatePercentage();
    }

    onResize() {
        this.calculateBounds();
        this.debugVisualizer?.resizeCurrentPosition(this.clientHeight, this.scrollHeight);
    }

    onScroll() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        this.calculatePercentage();
    }

    start() {
        this.calculateBounds();
        window.addEventListener('scroll', this.#handlers.scroll, { passive: true });
        window.addEventListener('resize', this.#handlers.resize, { passive: true });

        if (this.debugVisualizer) {
            this.debugVisualizer.init();
            this.debugVisualizer.resizeCurrentPosition(this.clientHeight, this.scrollHeight);
        }
    }

    prepareStep(step) {
        if (!step.changes) {
            return;
        }

        Object.entries(step.changes).forEach(([key, values]) => {
            step.parsedChanges[key] = parseStringChanges(values);
        });
    }

    addStep(step) {
        const preparedStep = {
            ...step,
            parsedChanges: [],
        };

        this.steps.push(preparedStep);
        this.prepareStep(preparedStep);
        this.calculateStep(preparedStep, {}, true);
    }

    addTrigger(trigger) {
        if (!trigger?.trigger) {
            console.warn('VanillaScroll: trigger must have a "trigger" element property');
            return this;
        }

        if (!(trigger.trigger instanceof Element)) {
            console.warn('VanillaScroll: trigger.trigger must be a DOM element');
            return this;
        }

        this.triggers.push(trigger);
        return this;
    }

    cleanup() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        if (this.cssGenerator) {
            this.cssGenerator.removeStyles();
            this.cssGenerator = null;
        }

        this.nodes.forEach(node => {
            if (node?.hasAttribute('data-vs-anim-id')) {
                node.removeAttribute('data-vs-anim-id');
            }
        });

        this.stepsWithEvents = [];
        window.removeEventListener('scroll', this.#handlers.scrollEvents);
    }

    destroy() {
        this.cleanup();

        window.removeEventListener('scroll', this.#handlers.scroll);
        window.removeEventListener('resize', this.#handlers.resize);

        this.debugVisualizer?.destroy();
        this.debugVisualizer = null;

        this.steps    = [];
        this.nodes    = [];
        this.triggers = [];
    }

    checkEventSteps() {
        this.stepsWithEvents.forEach(step => {
            const inRange = this.percentage >= step.start && this.percentage <= step.end;
            this.sendEvents(inRange)(step);
        });
    }

    onScrollEvents() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        const newScrollY = document.documentElement.scrollTop;
        this.percentage  = this.scrollHeight > 0 ? (newScrollY + this.scrollTop) / this.scrollHeight : 0;

        this.animationFrame = requestAnimationFrame(() => {
            this.checkEventSteps();
            this.debugVisualizer?.updateCurrentPosition(
                this.percentage,
                this.scrollTop,
                this.scrollHeight,
                this.clientHeight
            );
        });
    }

    buildCssAnimations(allStepsInfo) {
        this.cssGenerator = new CssGenerator(this.scrollHeight, this.clientHeight);

        allStepsInfo.forEach(step => {
            if (step.onEnter || step.onExit) {
                this.stepsWithEvents.push(step);
            }
            this.addStep(step);
        });

        this.calculateSteps();
        this.cssGenerator.build(allStepsInfo, this.nodes);

        window.removeEventListener('scroll', this.#handlers.scroll);
        if (this.stepsWithEvents.length > 0 || this.debug) {
            window.addEventListener('scroll', this.#handlers.scrollEvents, { passive: true });
        }
    }

    getActivePercentage() {
        return this.percentage;
    }

    build() {
        this.cleanup();
        this.steps = [];
        this.nodes = [];

        if (this.triggers.length === 0) {
            return this;
        }

        let colorIndex = 0;

        const triggerPositions = this.triggers.map((trigger) => {
            const triggerElement  = trigger.trigger;
            const rect            = triggerElement.getBoundingClientRect();
            const triggerStart    = (rect.top + window.scrollY) / this.scrollHeight;
            const triggerDuration = triggerElement.offsetHeight / this.scrollHeight;

            colorIndex++;

            return {
                trigger,
                color:    `hsl(${Math.round((colorIndex * GOLDEN_ANGLE) % DEGREES_IN_CIRCLE)}, ${DEBUG_COLOR_SATURATION}%, ${DEBUG_COLOR_LIGHTNESS}%)`,
                start:    triggerStart,
                duration: triggerDuration,
            };
        });

        triggerPositions.sort((first, second) => {
            if (first.start + first.duration <= second.start) {
                return -1;
            }

            if (second.start + second.duration <= first.start) {
                return 1;
            }

            return 0;
        });

        const allStepsInfo = [];

        triggerPositions.forEach(({ trigger, start, duration, color }) => {
            this.debugVisualizer?.addLevelIndicator(
                IndicatorType.trigger,
                trigger.name,
                start,
                duration,
                color
            );

            trigger.steps?.forEach(step => {
                if (!step.element || !(step.element instanceof Element)) {
                    console.warn('VanillaScroll: step must have a valid "element" property');
                    return;
                }

                const stepOffset   = step.offset ?? 0;
                const stepLength   = step.duration ?? 100;
                const stepStart    = stepOffset / 100 * duration + start;
                const stepDuration = stepLength / 100 * duration;
                let nodeId         = this.nodes.indexOf(step.element);

                if (nodeId === -1) {
                    nodeId = this.nodes.push(step.element) - 1;
                }

                allStepsInfo.push({
                    ...step,
                    color,
                    nodeId,
                    start:       stepStart,
                    end:         stepStart + stepDuration,
                    triggerName: trigger.name,
                });
            });
        });

        allStepsInfo.sort((first, second) => first.start - second.start);

        allStepsInfo.forEach(step => {
            this.debugVisualizer?.addLevelIndicator(
                IndicatorType.step,
                `${step.name} (${step.triggerName})`,
                step.start,
                step.end - step.start,
                step.color
            );
        });

        if (this.useCssAnimations) {
            this.buildCssAnimations(allStepsInfo);
        } else {
            allStepsInfo.forEach(step => this.addStep(step));
            this.calculateSteps();
        }

        this.calculateBounds();
        this.debugVisualizer?.applyStyleUpdates();

        return this;
    }
}

export default VanillaScroll;
