const IndicatorType = Object.freeze({
    currentPosition: 'current-position',
    trigger:         'trigger',
    step:            'step',
});

class VanillaScroll {
    constructor({ debug }) {
        this.debug          = debug;
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
        const indicator = this.addIndicator(type, name, topPositionInPercent, endInPercent, color);
        const indexes   = this.debugIndexes[type].indexes;

        if (indexes.length > 20) {
            let left  = 0;
            let right = indexes.length - 1;

            while (left <= right) {
                const mid = Math.floor((left + right) / 2);

                if (indexes[mid] <= topPositionInPercent) {
                    right = mid - 1;
                } else {
                    left = mid + 1;
                }
            }

            lowestFreeIndex = left;
        } else {
            const freeFoundIndex = indexes.findIndex(stepEnd => stepEnd <= topPositionInPercent);
            lowestFreeIndex      = freeFoundIndex === -1 ? indexes.length : freeFoundIndex;
        }

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

        return (values.from + ((values.to - values.from) * progressFactor)).toFixed(2);
    };

    calculateTick = (step, styleChanges, calculationFunction, eventFunction) => {
        const parsedChanges = step.parsedChanges;

        eventFunction(step);

        if (!parsedChanges) {
            return;
        }

        Object.entries(parsedChanges).forEach(([key, values]) => {
            const { from, to } = values;
            let formattedValue = '';

            Object.entries(from).forEach(([index, change]) => {
                const value = calculationFunction({ from: change.value, to: to[index].value }, step);
                formattedValue += `${change.prefix || ''}${value}${change.unit || ''}${change.suffix || ''}`;
            });

            if (!styleChanges[key]) {
                styleChanges[key] = '';
            }

            styleChanges[key] += formattedValue;
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
            const styleChanges = nodeStyleChanges[step.nodeId];

            nodeStyleChanges[step.nodeId] = this.calculateStep(step, styleChanges ?? {});
        });
        
        Object.entries(nodeStyleChanges).forEach(([nodeId, nodeStyleChange]) => {
            this.nodes[nodeId].style = Object.entries(nodeStyleChange).map(([property, value]) => `${property}:${value};`).join('');
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
        let match;
        const changes = {};
        const regex   = /(\w+)\(([-+]?[\d.]+)([a-zA-Z%]*)(?:,\s*([-+]?[\d.]+)([a-zA-Z%]*))*\)/g;

        while ((match = regex.exec(input)) !== null) {
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
                  step.parsedChanges[key] = {};

                  if (typeof values.to === 'string' && typeof values.from === 'string') {
                      step.parsedChanges[key] = this.parseStringChanges(values);
                  } else {
                      step.parsedChanges[key] = {
                          from: [{
                              value: values.from,
                          }],
                          to:   [{
                              value: values.to,
                          }],
                      };
                  }
              })
        ;
    };

    addStep = (start, end, nodeId, changes, onEnter, onExit) => {
        const step = {
            start,
            end,
            nodeId,
            changes,
            onEnter,
            onExit,
            parsedChanges: [],
        };

        this.steps.push(step);
        this.prepareStep(step);
        this.calculateStep(step, {}, true);
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
                    color,
                    nodeId,
                    name:        step.name,
                    start:       stepStart,
                    end:         stepStart + stepDuration,
                    changes:     step.change,
                    onEnter:     step.onEnter,
                    onExit:      step.onExit,
                    triggerName: trigger.name,
                });
            });
        });

        allStepsInfo
            .sort((a, b) => a.start - b.start)
            .forEach(({ name, start, end, nodeId, changes, onEnter, onExit, triggerName, color }) => {
                this.addStep(start, end, nodeId, changes, onEnter, onExit);
                this.addLevelIndicator(
                    IndicatorType.step,
                    `${name} (${triggerName})`,
                    start,
                    end - start,
                    color,
                );
            })
        ;

        this.calculateBounds();
        this.applyDebugStyleUpdates();
    };
}

export default VanillaScroll;
