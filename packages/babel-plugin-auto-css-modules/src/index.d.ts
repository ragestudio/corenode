import { Visitor } from '@babel/traverse';
export interface IOpts {
    flag?: string;
}
export default function (): {
    visitor: Visitor<{}>;
};
