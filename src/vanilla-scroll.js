const IndicatorType = Object.freeze({
    currentPosition: 'current-position',
    trigger:         'trigger',
    step:            'step',
});

class VanillaScroll {
    constructor({ debug }) {
        this.debug    = debug;
        this.steps    = [];
        this.triggers = [];

        this.start();
    }

    addIndicator = (type, name, topPositionInPercent, endInPercent, color) => {
        if (!this.debug) {
            return;
        }

        const indicator = document.createElement('div');

        indicator.setAttribute('indicator-name', name);
        indicator.style.setProperty('left', `${topPositionInPercent}%`);
        indicator.style.setProperty('width', `${endInPercent}%`);
        indicator.style.setProperty('border-color', color);
        indicator.classList.add(type);
        indicator.classList.add('indicator');
        this.debugElement.appendChild(indicator);

        return indicator;
    };

    addLevelIndicator = (type, name, topPositionInPercent, endInPercent, color) => {
        if (!this.debug) {
            return;
        }

        const indicator                                  = this.addIndicator(type, name, topPositionInPercent, endInPercent, color);
        const freeFoundIndex                             = this.debugIndexes[type].indexes.findIndex(stepEnd => stepEnd <= topPositionInPercent);
        const lowestFreeIndex                            = freeFoundIndex === -1 ? this.debugIndexes[type].indexes.length : freeFoundIndex;
        this.debugIndexes[type].indexes[lowestFreeIndex] = Math.floor(topPositionInPercent + endInPercent);

        if (lowestFreeIndex > this.debugIndexes[type].max) {
            this.debugIndexes[type].max = lowestFreeIndex;
        }

        indicator.style.setProperty('--step-level', `${lowestFreeIndex + 1}`);
        this.debugElement.style.setProperty(`--${type}-count`, `${this.debugIndexes[type].max + 2}`);
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

        this.debugElement     = document.createElement('div');
        const currentPosition = document.createElement('div');

        this.debugElement.classList.add('vanilla-scroll-debug');
        document.body.appendChild(this.debugElement);
        this.debugElement.appendChild(currentPosition);

        this.currentPosition = this.addIndicator(
            IndicatorType.currentPosition,
            null,
            document.documentElement.scrollTop,
            this.getCurrentPositionWidth(),
        );

        this.currentPosition.setAttribute('id', IndicatorType.currentPosition);
        window.addEventListener('resize', this.onResize);
    };

    updateCurrentPosition = (percentage) => {
        if (this.debug && this.currentPosition) {
            const fixedPercentage           = this.percentage.toFixed(2);
            const fixedVisiblePercentage    = percentage.toFixed(2);
            this.currentPosition.style.left = `${fixedPercentage}%`;

            this.currentPosition.setAttribute('indicator-name', `${fixedVisiblePercentage}%`);
        }
    };

    calculateInRangeSteps = (values, step) => {
        return (values.from + (
            (values.to - values.from) * (this.percentage - step.start) / (step.end - step.start)
        ));
    };

    calculateTick = (step, calculationFunction) => {
        Object.entries(step.changes).forEach(([key, values]) => {
            const prefix            = values.prefix || '';
            const suffix            = values.suffix || '';
            const value             = calculationFunction(values, step);
            step.element.style[key] = `${prefix}${value}${suffix}`;
        });
    };

    calculateStep = (step, initially = false) => {
        if (this.percentage >= step.start && this.percentage <= step.end) {
            step.lastTickInRange      = true;
            step.lastTickInAfterRange = false;

            this.calculateTick(step, this.calculateInRangeSteps);
        } else if (initially || step.lastTickInRange || step.lastTickInAfterRange) {
            step.lastTickInRange = false;

            if (this.percentage > step.end) {
                step.lastTickInAfterRange = true;

                this.calculateTick(step, (values) => values.to);
            }

            if (
                this.percentage < step.start &&
                (
                    !initially ||
                    step.lastTickInAfterRange
                )
            ) {
                step.lastTickInAfterRange = false;

                this.calculateTick(step, (values) => values.from);
            }
        }
    };

    calculateSteps = () => this.steps.forEach(step => this.calculateStep(step));

    calculatePercentage = () => {
        this.percentage  = (document.documentElement.scrollTop + this.scrollTop) / this.scrollHeight * 100;
        const percentage = (document.documentElement.scrollTop + this.scrollTop) / (this.scrollHeight - this.clientHeight) * 100;

        this.calculateSteps();
        this.updateCurrentPosition(percentage);
    };

    calculateBounds = () => {
        this.scrollTop    = document.body.scrollTop;
        this.scrollHeight = document.documentElement.scrollHeight;
        this.clientHeight = window.innerHeight;

        this.calculatePercentage();
    };

    getCurrentPositionWidth = () => (this.clientHeight / this.scrollHeight) * 100;
    resizeCurrentPosition   = () => this.currentPosition.style.setProperty('width', `${this.getCurrentPositionWidth()}%`);

    onResize = () => {
        this.calculateBounds();
        this.resizeCurrentPosition();
    };

    onScroll = () => this.calculatePercentage();

    start = () => {
        this.calculateBounds();
        window.addEventListener('scroll', this.onScroll, { passive: true });
        this.addDebug();
    };

    prepareStep = (step) => {
        Object.entries(step.changes).forEach(([key, values]) => {
            if (typeof values.to === 'string' && typeof values.from === 'string') {
                // const regex = new RegExp('(.*?)\\((\\d+(?:\.\d+)|-\\d+)(.*?)\\)');
                const regex              = new RegExp('(.*?)(-?\\d+)(.*)');
                const valueStringFrom    = values.from.match(regex);
                const valueStringTo      = values.to.match(regex);
                step.changes[key].from   = parseInt(valueStringFrom[2], 10);
                step.changes[key].to     = parseInt(valueStringTo[2], 10);
                step.changes[key].prefix = valueStringTo[1];
                step.changes[key].suffix = valueStringTo[3];
            }
        });
    };

    addStep = (start, end, element, changes) => {
        const step = {
            start,
            end,
            element,
            changes,
        };

        this.steps.push(step);
        this.prepareStep(step);
        this.calculateStep(step, true);
    };

    addTrigger = (trigger) => {
        this.triggers.push(trigger);
        return this;
    };

    build = () => {
        this.steps     = [];
        let colorIndex = 0;

        const triggersWithPositions = this.triggers.map((trigger) => {
            const triggerElement              = trigger.trigger;
            const rect                        = triggerElement.getBoundingClientRect();
            const triggerTopPositionInPercent = ((rect.top + window.scrollY) / this.scrollHeight) * 100;
            const triggerHeightInPercent      = triggerElement.offsetHeight / this.scrollHeight * 100;

            colorIndex++;

            return {
                trigger,
                color:       `hsl(${Math.round((colorIndex * 137) % 360)}, 70%, 50%)`,
                topPosition: triggerTopPositionInPercent,
                height:      triggerHeightInPercent,
            };
        });

        triggersWithPositions.sort((a, b) => {
            if (a.topPosition + a.height <= b.topPosition) {
                return -1;
            }

            if (b.topPosition + b.height <= a.topPosition) {
                return 1;
            }
        });

        let allStepsInfo = [];

        triggersWithPositions.forEach(({ trigger, topPosition, height, color }) => {
            const triggerTopPositionInPercent = topPosition;
            const triggerHeightInPercent      = height;

            this.addLevelIndicator(
                IndicatorType.trigger,
                trigger.name,
                triggerTopPositionInPercent,
                triggerHeightInPercent,
                color,
            );

            const stepsFromTrigger = trigger.steps.map(step => {
                const stepTopPositionInPercent = step.offset * triggerHeightInPercent / 100 + triggerTopPositionInPercent;
                const stepHeightInPercent      = step.duration * triggerHeightInPercent / 100;

                return {
                    color,
                    name:        step.name,
                    start:       stepTopPositionInPercent,
                    end:         Math.floor(stepTopPositionInPercent + stepHeightInPercent),
                    element:     step.element,
                    changes:     step.change,
                    triggerName: trigger.name,
                };
            });

            allStepsInfo = allStepsInfo.concat(stepsFromTrigger);
        });

        allStepsInfo.sort((a, b) => a.start - b.start);

        allStepsInfo.forEach(stepInfo => {
            this.addStep(stepInfo.start, stepInfo.end, stepInfo.element, stepInfo.changes);
            this.addLevelIndicator(
                IndicatorType.step,
                `${stepInfo.name} (${stepInfo.triggerName})`,
                stepInfo.start,
                stepInfo.end - stepInfo.start,
                stepInfo.color,
            );
        });

        this.calculateBounds();
    };
}

export default VanillaScroll;
