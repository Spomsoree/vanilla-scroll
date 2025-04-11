globalThis.testTimeout = 10000;

globalThis.waitForTransformChange = async (page, selector, valueToMatch, timeout = 1000) => {
    return page.evaluate(
        ({ selector, valueToMatch, timeout }) => {
            return new Promise(resolve => {
                const element = document.querySelector(selector);

                if (element.style.transform.includes(valueToMatch)) {
                    resolve(true);
                    return;
                }

                const checkTransform = () => {
                    if (element.style.transform.includes(valueToMatch)) {
                        resolve(true);
                    }
                };

                element.addEventListener('transitionend', () => resolve(true), { once: true });

                setTimeout(() => {
                    checkTransform();
                    resolve(true);
                }, timeout);

                const interval = setInterval(() => {
                    checkTransform();
                }, 100);

                setTimeout(() => clearInterval(interval), timeout);
            });
        },
        { selector, valueToMatch, timeout },
    );
};