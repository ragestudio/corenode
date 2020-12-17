import { verbosity } from './packages/utils/dist' 

function FakeFunction(params) {
    verbosity.options({ line: true }).log('ajam')
}
FakeFunction()