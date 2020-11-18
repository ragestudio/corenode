/// <reference types="react" />
declare const Home: {
    (props: any): JSX.Element;
    getInitialProps(props: any): Promise<{
        result: {
            userId: number;
            title: string;
        }[];
    }>;
};
export default Home;
