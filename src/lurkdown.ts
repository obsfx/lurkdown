let lurkdown = (buffer: string): string => {
    if (typeof buffer != 'string') {
        throw console.error('input buffer must be string.');
    }

    let output = '';
    let index: number = 0;

    let consume = (): string => {
        return buffer[index++];
    }

    let peek = (): string => {
        return buffer[index++];
    }

    return output;
}
