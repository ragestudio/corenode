import { verbosity } from './packages/utils/dist' 

function FakeFunction() {
    verbosity.log('testing', 'verbosity', { seams: "works good!" }, [{ thisIS: "epic" }, "yeah"])
    verbosity
    .colors({ 
        decorator: { 
            textColor: "red",
        }, 
        log: { 
            backgroundColor: "bgRed"
        }
    })
    .log('and now', 'with colors!', { me: "😯" })
}
FakeFunction()