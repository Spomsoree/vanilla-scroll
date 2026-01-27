import { parseStringChanges, reconstructValueRaw } from './parser.js';

export class CssGenerator {
    constructor(scrollHeight, clientHeight) {
        this.scrollHeight = scrollHeight;
        this.clientHeight = clientHeight;
        this.styleElement = null;
    }

    generateKeyframes(step, animationName) {
        if (!step.parsedChanges || Object.keys(step.parsedChanges).length === 0) {
            return '';
        }

        const fromProps = [];
        const toProps   = [];

        Object.entries(step.parsedChanges).forEach(([key, parsed]) => {
            const cssKey                 = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
            const { template, from, to } = parsed;

            const fromValue = reconstructValueRaw(template, from);
            const toValue   = reconstructValueRaw(template, to);

            fromProps.push(`${cssKey}:${fromValue}`);
            toProps.push(`${cssKey}:${toValue}`);
        });

        return `@keyframes ${animationName}{from{${fromProps.join(';')}}to{${toProps.join(';')}}}`;
    }

    generateCss(elementAnimations, nodes) {
        let keyframes = '';
        let selectors = '';
        const scrollableRange  = this.scrollHeight - this.clientHeight;
        const conversionFactor = scrollableRange > 0 ? this.scrollHeight / scrollableRange : 1;

        Object.entries(elementAnimations).forEach(([nodeId, steps]) => {
            const element = nodes[nodeId];
            element.setAttribute('data-vs-anim-id', nodeId);

            const animationNames  = [];
            const animationRanges = [];
            const stepData        = [];

            steps.forEach((step) => {
                if (!step.parsedChanges || Object.keys(step.parsedChanges).length === 0) {
                    return;
                }

                const animationName = `vs-${nodeId}-${step.stepIndex}`;
                const keyframesCss  = this.generateKeyframes(step, animationName);
                const hasTransform  = Object.keys(step.parsedChanges).some(key => key === 'transform');

                if (keyframesCss) {
                    keyframes += keyframesCss;
                    animationNames.push(animationName);
                    const startPercent = (step.start * conversionFactor * 100).toFixed(2);
                    const endPercent   = (step.end * conversionFactor * 100).toFixed(2);
                    animationRanges.push(`${startPercent}% ${endPercent}%`);
                    stepData.push({ start: step.start, end: step.end, hasTransform });
                }
            });

            const compositions = stepData.map((current, index) => {
                if (!current.hasTransform) {
                    return 'replace';
                }
                const hasOverlap = stepData.some((other, otherIndex) => {
                    if (otherIndex === index || !other.hasTransform) {
                        return false;
                    }
                    return current.start < other.end && current.end > other.start;
                });
                return hasOverlap ? 'add' : 'replace';
            });

            if (animationNames.length > 0) {
                const count     = animationNames.length;
                const timelines = Array(count).fill('scroll(root)').join(',');
                const durations = Array(count).fill('1s').join(',');
                const fillModes = Array(count).fill('forwards').join(',');
                const timingFns = Array(count).fill('linear').join(',');
                selectors += `[data-vs-anim-id="${nodeId}"]{animation-name:${animationNames.join(',')};animation-duration:${durations};animation-timing-function:${timingFns};animation-fill-mode:${fillModes};animation-timeline:${timelines};animation-range:${animationRanges.join(',')};animation-composition:${compositions.join(',')}}`;
            }
        });

        return keyframes + selectors;
    }

    injectStyles(css) {
        this.styleElement           = document.createElement('style');
        this.styleElement.id        = 'vanilla-scroll-animations';
        this.styleElement.textContent = css;
        document.head.appendChild(this.styleElement);
    }

    removeStyles() {
        if (this.styleElement) {
            this.styleElement.remove();
            this.styleElement = null;
        }
    }

    groupStepsByElement(steps) {
        const grouped = {};
        steps.forEach((step, index) => {
            const nodeId = step.nodeId;
            if (!grouped[nodeId]) {
                grouped[nodeId] = [];
            }
            grouped[nodeId].push({ ...step, stepIndex: index });
        });
        return grouped;
    }

    build(allStepsInfo, nodes) {
        allStepsInfo.forEach(step => {
            step.parsedChanges = {};
            if (step.changes) {
                Object.entries(step.changes).forEach(([key, values]) => {
                    step.parsedChanges[key] = parseStringChanges(values);
                });
            }
        });

        const elementAnimations = this.groupStepsByElement(allStepsInfo);
        const css = this.generateCss(elementAnimations, nodes);
        this.injectStyles(css);
    }
}
