
export function dateToAMPM(date: Date) {
    const hours = date.getHours();
    const minutes = date.getMinutes() > 9 ? date.getMinutes().toString() : '0' + date.getMinutes();

    const ampm = date.getHours() > 12 ? 'PM' : 'AM';

    return `${hours > 12 ? hours - 12 : hours}:${minutes} ${ampm}`;
}

export function datetoFullDateString(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    };

    return `${new Intl.DateTimeFormat('en-US', options).format(date)} at ${dateToAMPM(date)}`;
}

export function dateToShortDate(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
}