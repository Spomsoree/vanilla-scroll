const IndicatorType = Object.freeze({
    currentPosition: 'current-position',
    trigger:         'trigger',
    step:            'step',
});

class Scrolling {
    constructor({ debug }) {
        this.debug = debug;
        this.steps = [];

        this.start();
    }

    addIndicator = (type, name, topPositionInPercent, endInPercent) => {
        if (!this.debug) {
            return;
        }

        const indicator = document.createElement('div');

        indicator.setAttribute('indicator-name', name);
        indicator.style.setProperty('left', `${topPositionInPercent}%`);
        indicator.style.setProperty('width', `calc(${endInPercent}% + 1px)`);
        indicator.style.setProperty('border-color', `#${Math.floor(Math.random() * 16777215).toString(16)}`);
        indicator.classList.add(type);
        indicator.classList.add('indicator');
        this.debugElement.appendChild(indicator);

        return indicator;
    };

    addStepIndicator = (name, topPositionInPercent, endInPercent) => {
        if (!this.debug) {
            return;
        }

        const triggerIndex = this.steps.filter(step => step.start <= topPositionInPercent && step.end >= topPositionInPercent).length;
        const indicator    = this.addIndicator(IndicatorType.step, name, topPositionInPercent, endInPercent);

        if (triggerIndex > this.maxTriggerIndex) {
            this.maxTriggerIndex = triggerIndex;
        }

        indicator.style.setProperty('--indicator-level', `${triggerIndex}`);
        this.debugElement.style.setProperty('--indicator-count', `${this.maxTriggerIndex + 1}`);

        return indicator;
    };

    addTriggerIndicator = (name, topPositionInPercent, endInPercent) => this.addIndicator(IndicatorType.trigger, name, topPositionInPercent, endInPercent);

    addCurrentPositionIndicator = () => {
        const indicator = this.addIndicator(IndicatorType.currentPosition);

        indicator.setAttribute('id', IndicatorType.currentPosition);

        return indicator;
    };

    addDebug = () => {
        if (this.debug) {
            const debug = document.createElement('div');

            debug.classList.add('debug');
            document.body.appendChild(debug);

            this.maxTriggerIndex = 0;
            this.debugElement    = debug;
            this.currentPosition = this.addCurrentPositionIndicator();
        }
    };

    updateCurrentPosition = () => {
        if (this.currentPosition) {
            const percentage                = this.percentage.toFixed(2);
            this.currentPosition.style.left = `${percentage}%`;

            this.currentPosition.setAttribute('indicator-name', `${percentage}%`);
        }
    };

    calculateInRangeSteps = (values, step) => {
        return (
            values.from + (
                (
                    values.to - values.from
                ) * (
                    this.percentage - step.start
                ) / (
                    step.end - step.start
                )
            )
        );
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
        this.percentage = (
            document.documentElement.scrollTop + this.scrollTop
        ) / (
            this.scrollHeight - this.clientHeight
        ) * 100;

        this.calculateSteps();
        this.updateCurrentPosition();
    };

    calculateBounds = () => {
        this.scrollTop    = document.body.scrollTop;
        this.scrollHeight = document.documentElement.scrollHeight;
        this.clientHeight = document.documentElement.clientHeight;

        this.calculatePercentage();
        //this.updateIndicators();
    };

    onScroll = () => this.calculatePercentage();

    start = () => {
        this.addDebug();
        this.calculateBounds();
        window.addEventListener('resize', this.calculateBounds);
        window.addEventListener('scroll', this.onScroll);
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
        const triggerElement              = trigger.trigger;
        const triggerTopPositionInPercent = (
            (
                triggerElement.getBoundingClientRect().top + window.scrollY
            ) / this.scrollHeight
        ) * 100;
        const triggerHeightInPercent      = triggerElement.offsetHeight / this.scrollHeight * 100;

        this.addTriggerIndicator(trigger.name, triggerTopPositionInPercent, triggerHeightInPercent);

        trigger.steps
               .sort((a, b) => a.offset - b.offset)
               .forEach((step) => {
                   const stepTopPositionInPercent = step.offset * triggerHeightInPercent / 100 + triggerTopPositionInPercent;
                   const stepHeightInPercent      = step.duration * triggerHeightInPercent / 100;

                   this.addStep(stepTopPositionInPercent, stepTopPositionInPercent + stepHeightInPercent, step.element, step.change);
                   this.addStepIndicator(step.name, stepTopPositionInPercent, stepHeightInPercent);
               })
        ;
    };
}

export default Scrolling;
