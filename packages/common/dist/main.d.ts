export * from "./types/courses";
declare const Courses: {
    FullstackTypeScript: {
        "id": string;
        "title": string;
        "modules": {
            "id": string;
            "title": string;
            "challenges": ({
                "id": string;
                "type": string;
                "title": string;
                "content": string;
                "starterCode": string;
                "solutionCode": string;
                "testCode": string;
                "videoUrl": string;
                "supplementaryContent": string;
            } | {
                "id": string;
                "type": string;
                "title": string;
                "content": string;
                "starterCode": string;
                "solutionCode": string;
                "testCode": string;
                "supplementaryContent": string;
                "videoUrl"?: undefined;
            })[];
        }[];
    };
};
export default Courses;
