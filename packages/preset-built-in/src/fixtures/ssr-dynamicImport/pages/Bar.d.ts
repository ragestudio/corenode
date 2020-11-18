/// <reference types="react" />
declare const Bar: {
    (props: any): JSX.Element;
    getInitialProps(): Promise<{
        title: string;
    }>;
};
export default Bar;
