import { createLogger, format, transports } from 'winston'

const { combine, timestamp, label, printf } = format

export default ({ level, stack }) => createLogger({
    format: combine(
        label({ label: level }),
        timestamp(),
        printf(({ message, label, timestamp }) => {
            return `> ${timestamp} ${(stack?.method ?? false) ? `${stack.method}` : ''}[${label ?? "log"}] : ${message}`
        })
    ),
    transports: [
        new transports.File({ filename: "dumps.log" }),
    ],
})