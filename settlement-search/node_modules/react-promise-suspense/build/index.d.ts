declare const usePromise: <Args extends any[], Result>(promise: (...inputs: Args) => Promise<Result>, inputs: Args, lifespan?: number) => Result;
export = usePromise;
