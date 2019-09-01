export function mapToArray(json, key_name) {
    return Object.keys(json).map(function(key) {
        json[key][key_name] = key;
        return json[key];
    });
}

export function intersect(dataArr, accessor, transformToSingle) {
    const pointers = Array.apply(null, {length: dataArr.length}).map(() => 0);

    const intersection = [];
    let maxIndex = 0;
    let agreements = 0;
    while (true) {
        while (agreements < dataArr.length) {
            for (let i=0; i < dataArr.length; i++) {
                const data = dataArr[i];
        
                let currentIndex = accessor(data[pointers[i]]);
                while (currentIndex < maxIndex) {
                    pointers[i]++;
                    if (pointers[i] === data.length) {
                        return intersection;
                    }
    
                    currentIndex = accessor(data[pointers[i]]);
                }
                if (currentIndex > maxIndex) {
                    maxIndex = currentIndex;
                    agreements = 1;
                } else {
                    agreements++;
                }
            }
        }

        let sameItems = dataArr.reduce((sameItems, data, i) => {
            sameItems.push(data[pointers[i]])
            return sameItems;
        }, [])

        let item = transformToSingle(sameItems);
        if (item) {
            intersection.push(item);
        }
        maxIndex += 1;
        agreements = 0;
    }
}

export function areSetsEqual(set, otherSet) {
    if (set.size !== otherSet.size) return false;
    for (let item in set) {
        if (!otherSet.has(item)) {
            return false;
        }
    }
    return true;
}

export function isChanged(changeSignals, obj, otherObj, debug, sourceName) {
    const changes = []
    for (let i = 0; i < changeSignals.length; i++) {
        const changeSignal = changeSignals[i];
        if (obj[changeSignal] !== otherObj[changeSignal]) {
            if (debug) {
                changes.push(changeSignal);
            }
            else {
                return true;
            }
        }
    }

    let changed = changes.length > 0;
    if (debug) {
        if (changed) {
            console.log(`${sourceName} Caused update: ${changes.join(', ')}`);
        }
    }
    return changed;
}

export function shouldUpdate(props_updateSignals, state_updateSignals, props, state, nextProps, nextState, debug, componentName) {
    
    const propsUpdated = isChanged(props_updateSignals, props, nextProps, debug, `[${componentName}][props]`)
    const stateUpdated = isChanged(state_updateSignals, state, nextState, debug, `[${componentName}][state]`)

    return propsUpdated || stateUpdated;
}

export function displayIndexToViewIndex(displayIndex, page, pageSize) {
    if (Math.floor(displayIndex / pageSize) === page) {
        const viewIndex = displayIndex % pageSize;
        return viewIndex;
    }
}

export function displayIndexesToViewIndex(displayIndexes, page, pageSize, returnObject=false) {
    return displayIndexes.reduce((acuumulator, displayIndex) => {
        const viewIndex = displayIndexToViewIndex(displayIndex, page, pageSize)
        if (viewIndex !== undefined) {
            if (returnObject) {
                acuumulator[viewIndex] = true;
            } else {
                acuumulator.push(viewIndex)
            }
        }
        return acuumulator;
    }, returnObject ? {} : []);
}

export function viewIndexToDisplayIndex(viewIndex, page, pageSize) {
    const displayIndex = (pageSize * page) + viewIndex;
    return displayIndex;
}

export function viewIndexToDisplayIndexes(viewIndexes, page, pageSize, returnObject=false) {
    return viewIndexes.reduce((acuumulator, viewIndex) => {
        const displayIndex = viewIndexToDisplayIndex(viewIndex, page, pageSize)
        if (returnObject) {
            acuumulator[displayIndex] = true;
        } else {
            acuumulator.push(displayIndex)
        }
        return acuumulator;
    }, returnObject ? {} : []);
}
