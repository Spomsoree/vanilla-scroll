const IndicatorType = Object.freeze({
    currentPosition: 'current-position',
    trigger:         'trigger',
    step:            'step',
});

class VanillaScroll {
    constructor(options) {
        this.debug          = options?.debug;
        this.steps          = [];
        this.nodes          = [];
        this.triggers       = [];
        this.percentage     = 0;
        this.scrollTop      = 0;
        this.scrollHeight   = 0;
        this.clientHeight   = 0;
        this.animationFrame = null;

        this.start();
    }

    addIndicator = (type, name, topPositionInPercent, endInPercent, color) => {
        if (!this.debug) {
            return null;
        }

        const indicator = document.createElement('div');
        const styles    = {
            left:        this.setCssPercent(topPositionInPercent),
            width:       this.setCssPercent(endInPercent),
            borderColor: color,
        };

        Object.assign(indicator.style, styles);
        indicator.setAttribute('indicator-name', name);
        indicator.classList.add(type, 'indicator');
        this.debugElement.appendChild(indicator);

        return indicator;
    };

    addLevelIndicator = (type, name, topPositionInPercent, endInPercent, color) => {
        if (!this.debug) {
            return;
        }

        let lowestFreeIndex;
        const indicator      = this.addIndicator(type, name, topPositionInPercent, endInPercent, color);
        const indexes        = this.debugIndexes[type].indexes;
        const freeFoundIndex = indexes.findIndex(stepEnd => stepEnd <= topPositionInPercent);
        lowestFreeIndex      = freeFoundIndex === -1 ? indexes.length : freeFoundIndex;

        this.debugIndexes[type].indexes[lowestFreeIndex] = topPositionInPercent + endInPercent - 0.0001;

        if (lowestFreeIndex > this.debugIndexes[type].max) {
            this.debugIndexes[type].max = lowestFreeIndex;
        }

        indicator.style.setProperty('--step-level', `${lowestFreeIndex + 1}`);
    };

    applyDebugStyleUpdates = () => {
        if (!this.debug) {
            return;
        }

        Object.entries(this.debugIndexes).forEach(([type, data]) => this.debugElement.style.setProperty(`--${type}-count`, `${data.max + 2}`));
    };

    addDebug = () => {
        if (!this.debug) {
            return;
        }

        this.debugIndexes = {
            [IndicatorType.step]:    {
                max:     0,
                indexes: [],
            },
            [IndicatorType.trigger]: {
                max:     0,
                indexes: [],
            },
        };

        this.debugElement    = document.createElement('div');
        this.currentPosition = this.addIndicator(
            IndicatorType.currentPosition,
            null,
            document.documentElement.scrollTop,
            this.getCurrentPositionWidth(),
        );

        this.debugElement.classList.add('vanilla-scroll-debug');
        document.body.appendChild(this.debugElement);
        this.currentPosition.setAttribute('id', IndicatorType.currentPosition);
    };

    updateCurrentPosition = () => {
        if (!this.debug || !this.currentPosition) {
            return;
        }

        const scrollPercentage = (document.documentElement.scrollTop + this.scrollTop) / (this.scrollHeight - this.clientHeight);

        if (!this.positionUpdateScheduled) {
            this.positionUpdateScheduled = true;

            requestAnimationFrame(() => {
                this.currentPosition.style.left = this.setCssPercent(this.percentage);
                this.positionUpdateScheduled    = false;

                this.currentPosition.setAttribute('indicator-name', this.setCssPercent(scrollPercentage));
            });
        }
    };

    getEvent = (type, step) => {
        return new CustomEvent(
            type,
            {
                detail: {
                    element: this.nodes[step.nodeId],
                },
            },
        );
    };

    sendEvents = (didEnter) => (step) => {
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

    calculateInRangeSteps = (values, step) => {
        const progressFactor = (this.percentage - step.start) / (step.end - step.start);

        return values.from + ((values.to - values.from) * progressFactor);
    };

    calculateTick = (step, styleChanges, calculationFunction, eventFunction) => {
        const parsedChanges = step.parsedChanges;

        eventFunction(step);

        if (!parsedChanges) {
            return;
        }

        Object.entries(parsedChanges).forEach(([key, values]) => {
            const cssKey       = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
            const { from, to } = values;

            Object.entries(from).forEach(([index, change]) => {
                const value  = calculationFunction({ from: change.value, to: to[index].value }, step);
                const prefix = change.prefix ?? 0;

                if (!styleChanges[cssKey]) {
                    styleChanges[cssKey] = {};
                }

                styleChanges[cssKey][prefix] = {
                    ...change,
                    value,
                };
            });
        });

        return styleChanges;
    };

    calculateStep = (step, styleChanges, initially = false) => {
        if (
            !initially &&
            !step.lastTickInRange &&
            !step.lastTickInAfterRange &&
            (this.percentage < step.start || this.percentage > step.end)
        ) {
            return styleChanges;
        }

        if (this.percentage >= step.start && this.percentage <= step.end) {
            step.lastTickInRange      = true;
            step.lastTickInAfterRange = false;

            return this.calculateTick(step, styleChanges, this.calculateInRangeSteps, this.sendEvents(true));
        } else if (initially || step.lastTickInRange || step.lastTickInAfterRange) {
            step.lastTickInRange = false;

            if (this.percentage > step.end) {
                step.lastTickInAfterRange = true;
                return this.calculateTick(step, styleChanges, (values) => values.to, this.sendEvents(false));
            }

            if (
                this.percentage < step.start &&
                (!initially || step.lastTickInAfterRange)
            ) {
                step.lastTickInAfterRange = false;
                return this.calculateTick(step, styleChanges, (values) => values.from, this.sendEvents(false));
            }
        }

        return styleChanges;
    };

    calculateSteps = () => {
        const nodeStyleChanges = {};

        this.steps.forEach(step => {
            nodeStyleChanges[step.nodeId] = this.calculateStep(step, nodeStyleChanges[step.nodeId] ?? {});
        });

        Object.entries(nodeStyleChanges).forEach(([nodeId, nodeStyleChange]) => {
            this.nodes[nodeId].style = Object.entries(nodeStyleChange).map(([property, value]) => {
                const stringValue = Object.values(value).map(val => {
                    return `${val.prefix || ''}${val.value.toFixed(2)}${val.unit || ''}${val.suffix || ''}`;
                }).join('');

                return `${property}:${stringValue};`;
            }).join('');
        });
    };

    calculatePercentage = () => {
        const newScrollY    = document.documentElement.scrollTop;
        this.percentage     = (newScrollY + this.scrollTop) / this.scrollHeight;
        this.animationFrame = requestAnimationFrame(() => {
            this.calculateSteps();
            this.updateCurrentPosition();
        });
    };

    calculateBounds = () => {
        this.scrollTop    = document.body.scrollTop;
        this.scrollHeight = document.documentElement.scrollHeight;
        this.clientHeight = window.innerHeight;

        this.calculatePercentage();
    };

    setCssPercent = (() => {
        const cache = {};

        return (percent) => {
            const key = Math.round(percent * 10000);

            if (cache[key] === undefined) {
                cache[key] = `${(percent * 100).toFixed(2)}%`;
            }

            return cache[key];
        };
    })();

    getCurrentPositionWidth = () => this.clientHeight / this.scrollHeight;

    resizeCurrentPosition = () => {
        if (this.currentPosition) {
            this.currentPosition.style.width = this.setCssPercent(this.getCurrentPositionWidth());
        }
    };

    onResize = () => {
        this.calculateBounds();
        this.resizeCurrentPosition();
    };

    onScroll = () => {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        this.calculatePercentage();
    };

    start = () => {
        this.calculateBounds();
        window.addEventListener('scroll', this.onScroll, { passive: true });
        window.addEventListener('resize', this.onResize, { passive: true });
        this.addDebug();
    };

    parseStringChange = (input) => {
        if (typeof input !== 'string') {
            return {
                0: {
                    value: input,
                },
            };
        }

        let match;
        let didMatch  = false;
        const changes = {};
        const regex   = /(\w+)\(([-+]?[\d.]+)([a-zA-Z%]*)(?:,\s*([-+]?[\d.]+)([a-zA-Z%]*))*\)/g;

        while ((match = regex.exec(input)) !== null) {
            didMatch     = true;
            const prefix = `${match[1]}(`;
            const value  = parseFloat(match[2]);
            const unit   = value && match[3] !== '' ? match[3] : null;

            changes[prefix] = {
                unit,
                value,
                prefix,
                suffix: ')',
            };
        }

        if (!didMatch) {
            const simpleRegex = /([-+]?[\d.]+)([a-zA-Z%]*)/g;

            while ((match = simpleRegex.exec(input)) !== null) {
                changes[0] = {
                    unit:  match[2],
                    value: parseFloat(match[1]),
                };
            }
        }

        return changes;
    };

    parseStringChanges = (values) => {
        const fromValues = this.parseStringChange(values.from);
        const toValues   = this.parseStringChange(values.to);

        Object.entries(fromValues).forEach(([key, from]) => {
            const to = toValues[key];

            if (to.unit && !from.unit) {
                from.unit = to.unit;
            } else if (from.unit && !to.unit) {
                to.unit = from.unit;
            }
        });

        return {
            from: fromValues,
            to:   toValues,
        };
    };

    prepareStep = (step) => {
        if (!step.changes) {
            return;
        }

        Object.entries(step.changes)
              .forEach(([key, values]) => {
                  step.parsedChanges[key] = this.parseStringChanges(values);
              })
        ;
    };

    addStep = (step) => {
        const preparedStep = {
            ...step,
            parsedChanges: [],
        };

        this.steps.push(preparedStep);
        this.prepareStep(preparedStep);
        this.calculateStep(preparedStep, {}, true);
    };

    addTrigger = (trigger) => {
        this.triggers.push(trigger);
        return this;
    };

    build = () => {
        this.steps     = [];
        let colorIndex = 0;

        const triggerPositions = this.triggers.map((trigger) => {
            const triggerElement  = trigger.trigger;
            const rect            = triggerElement.getBoundingClientRect();
            const triggerStart    = (rect.top + window.scrollY) / this.scrollHeight;
            const triggerDuration = triggerElement.offsetHeight / this.scrollHeight;

            colorIndex++;

            return {
                trigger,
                color:    `hsl(${Math.round((colorIndex * 137) % 360)}, 70%, 50%)`,
                start:    triggerStart,
                duration: triggerDuration,
            };
        });

        triggerPositions.sort((a, b) => {
            if (a.start + a.duration <= b.start) {
                return -1;
            }

            if (b.start + b.duration <= a.start) {
                return 1;
            }

            return 0;
        });

        const allStepsInfo = [];

        triggerPositions.forEach(({ trigger, start, duration, color }) => {
            this.addLevelIndicator(
                IndicatorType.trigger,
                trigger.name,
                start,
                duration,
                color,
            );

            trigger.steps?.forEach(step => {
                let nodeId;
                const stepStart    = step.offset / 100 * duration + start;
                const stepDuration = step.duration / 100 * duration;
                const nodeIndex    = this.nodes.indexOf(step.element);

                if (nodeIndex > -1) {
                    nodeId = nodeIndex;
                } else {
                    this.nodes.push(step.element);

                    nodeId = this.nodes.indexOf(step.element);
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

        allStepsInfo
            .sort((a, b) => a.start - b.start)
            .forEach(step => {
                this.addStep(step);
                this.addLevelIndicator(
                    IndicatorType.step,
                    `${step.name} (${step.triggerName})`,
                    step.start,
                    step.end - step.start,
                    step.color,
                );
            })
        ;

        this.calculateBounds();
        this.applyDebugStyleUpdates();
    };
}

export default VanillaScroll;
