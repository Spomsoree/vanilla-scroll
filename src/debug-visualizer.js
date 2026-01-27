import {
    IndicatorType,
    PERCENT_CACHE_PRECISION,
    INDICATOR_OVERLAP_EPSILON,
} from './constants.js';

const percentCache = {};

function setCssPercent(percent) {
    const key = Math.round(percent * PERCENT_CACHE_PRECISION);

    if (percentCache[key] === undefined) {
        percentCache[key] = `${(percent * 100).toFixed(2)}%`;
    }

    return percentCache[key];
}

export class DebugVisualizer {
    constructor() {
        this.debugElement           = null;
        this.currentPosition        = null;
        this.debugIndexes           = null;
        this.positionUpdateScheduled = false;
    }

    init() {
        this.debugIndexes = {
            [IndicatorType.step]:    { max: 0, indexes: [] },
            [IndicatorType.trigger]: { max: 0, indexes: [] },
        };

        this.debugElement    = document.createElement('div');
        this.currentPosition = this.addIndicator(
            IndicatorType.currentPosition,
            null,
            document.documentElement.scrollTop,
            0,
        );

        this.debugElement.classList.add('vanilla-scroll-debug');
        document.body.appendChild(this.debugElement);
        this.currentPosition.setAttribute('id', IndicatorType.currentPosition);
    }

    addIndicator(type, name, topPositionInPercent, endInPercent, color) {
        const indicator = document.createElement('div');
        const styles    = {
            left:        setCssPercent(topPositionInPercent),
            width:       setCssPercent(endInPercent),
            borderColor: color,
        };

        Object.assign(indicator.style, styles);
        indicator.setAttribute('indicator-name', name);
        indicator.classList.add(type, 'indicator');
        this.debugElement.appendChild(indicator);

        return indicator;
    }

    addLevelIndicator(type, name, topPositionInPercent, endInPercent, color) {
        const indicator      = this.addIndicator(type, name, topPositionInPercent, endInPercent, color);
        const indexes        = this.debugIndexes[type].indexes;
        const freeFoundIndex = indexes.findIndex(stepEnd => stepEnd <= topPositionInPercent);
        const lowestFreeIndex = freeFoundIndex === -1 ? indexes.length : freeFoundIndex;

        this.debugIndexes[type].indexes[lowestFreeIndex] = topPositionInPercent + endInPercent - INDICATOR_OVERLAP_EPSILON;

        if (lowestFreeIndex > this.debugIndexes[type].max) {
            this.debugIndexes[type].max = lowestFreeIndex;
        }

        indicator.style.setProperty('--step-level', `${lowestFreeIndex + 1}`);
    }

    applyStyleUpdates() {
        Object.entries(this.debugIndexes).forEach(([type, data]) => {
            this.debugElement.style.setProperty(`--${type}-count`, `${data.max + 2}`);
        });
    }

    updateCurrentPosition(percentage, scrollTop, scrollHeight, clientHeight) {
        if (!this.currentPosition) {
            return;
        }

        const scrollableHeight = scrollHeight - clientHeight;
        const scrollPercentage = scrollableHeight > 0
            ? (document.documentElement.scrollTop + scrollTop) / scrollableHeight
            : 0;

        if (!this.positionUpdateScheduled) {
            this.positionUpdateScheduled = true;

            requestAnimationFrame(() => {
                this.currentPosition.style.left = setCssPercent(percentage);
                this.positionUpdateScheduled    = false;
                this.currentPosition.setAttribute('indicator-name', setCssPercent(scrollPercentage));
            });
        }
    }

    resizeCurrentPosition(clientHeight, scrollHeight) {
        if (this.currentPosition) {
            const width = scrollHeight > 0 ? clientHeight / scrollHeight : 0;
            this.currentPosition.style.width = setCssPercent(width);
        }
    }

    destroy() {
        if (this.debugElement) {
            this.debugElement.remove();
            this.debugElement = null;
        }
        this.currentPosition = null;
        this.debugIndexes    = null;
    }
}

export { setCssPercent };
