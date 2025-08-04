export const joinAdapters = (baseAdapter, ...adapters) => {
    return (LuciaError) => {
        return Object.assign(
        // start with the baseAdapter
        baseAdapter(LuciaError), 
        // merge in the partial adapters
        ...adapters.map((adapter) => {
            if (typeof adapter === "function")
                return adapter(LuciaError);
            return adapter;
        }));
    };
};
