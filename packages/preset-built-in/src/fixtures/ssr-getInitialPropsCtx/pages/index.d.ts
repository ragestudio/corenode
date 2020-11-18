/// <reference types="react" />
declare const TestParams: {
    (props: any): JSX.Element;
    getInitialProps(props: any): Promise<{
        fromServerTitle: any;
    }>;
};
export default TestParams;
