const JobCardSkeleton = () => {
    return (
        <div className="w-full rounded-xl dark:bg-[#0f121e] p-5 shadow-lg animate-pulse">

          
            <div className="flex w-full gap-4">
             
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-md bg-gray-700 flex-shrink-0" />

                
                <div className="flex flex-col justify-between flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-gray-700 rounded" />
                    <div className="h-4 w-full bg-gray-700 rounded" />
                    <div className="h-4 w-2/3 bg-gray-700 rounded" />
                </div>
            </div>

       
            <div className="mt-4 flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((_, i) => (
                    <div
                        key={i}
                        className="h-[22px] w-20 bg-gray-700 rounded-full"
                    />
                ))}
            </div>
        </div>
    );
};

export default JobCardSkeleton;
