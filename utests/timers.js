const countToOneBillion = runtime.withTimerSync(() => {
    var i = 0;
    while (i < 1000000000) {
        i++;
    }

    return "done"
}, "count")


const res = countToOneBillion()
console.log(res)