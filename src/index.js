
import {hello} from './greet'
import {aws_config} from './aws_export'

import {
	CognitoUserPool,
	CognitoUserAttribute,
	CognitoUser,
    AuthenticationDetails,
} from 'amazon-cognito-identity-js';

import S3 from 'aws-sdk/clients/s3';

const userPool = new CognitoUserPool({
    UserPoolId: aws_config.userPoolId,
    ClientId: aws_config.clientId,
});

const register = (registerRequest) => {
    return new Promise((resolve, reject) => {
        const attributeList = [
            new CognitoUserAttribute({
                Name: 'website',
                Value: registerRequest.website,
            })
        ];
    
        userPool.signUp(
            registerRequest.email,
            registerRequest.password,
            attributeList,
            null,
            (err, result) => {
                if (err) {
                    reject(err)
                }
        
                resolve(result);
            }
        )
    })
}

const confirmAccount = (confirmRequest) => {
    return new Promise((resolve, reject) => {
        const user = new CognitoUser({
            Username: confirmRequest.email,
            Pool: userPool
        });

        user.confirmRegistration(confirmRequest.code, true, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        })
    });
}

const login = (loginRequest) => {
    const authDetails = new AuthenticationDetails({
        Username: loginRequest.email,
        Password: loginRequest.password,
    });

    const user = new CognitoUser({
        Username: loginRequest.email,
        Pool: userPool
    });

    return new Promise((resolve, reject) => {
        user.authenticateUser(authDetails, {
            onSuccess: (result) => {
                resolve(result);
            },
            onFailure: (err) => {
                reject(err);
            }
        })
    });
}

const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const user = userPool.getCurrentUser();

        if (user == null) {
            reject("User not available");
        }

        user.getSession((err, session) => {
            if (err) {
                reject(err);
            }
            
            user.getUserAttributes((err, attributes) => {
                if (err) {
                    reject(err);
                }

                const profile = attributes.reduce((profile, item) => {
                    return {...profile, [item.Name]: item.Value}
                }, {});

                resolve(profile)
            });

        })
        
    })
}

const listFiles = () => {
    const s3 = new S3();
    return new Promise((resolve, reject) => {
        s3.listObjectsV2({
            Bucket: aws_config.bucketName,
            MaxKeys: 10
        }, (err, date) => {
            if (err) {
                reject(err);
            }
            
            resolve(date);
        })
    });
}

const registerBtn = document.querySelector('button.register');
const registerRequestPayload = {
    email: "bgc65182@eoopy.com",
    password: "1234qwer",
    website: 'jkan.pl',
}

registerBtn.addEventListener('click', () => {
    register(registerRequestPayload)
        .then(result => console.log(result))
        .catch(err => console.log(err))
    ;
});


const confirmAccountBtn = document.querySelector('button.confirmAccount');
const confirmAccountRequest = {
    code: '843065',
    email: registerRequestPayload.email,
};
confirmAccountBtn.addEventListener('click', () => {
    confirmAccount(confirmAccountRequest)
        .then(result => console.log(result))
        .catch(err => console.log(err))
    ;
});

const loginBtn = document.querySelector('button.login');
const loginRequestPayload = {
    email: registerRequestPayload.email,
    password: registerRequestPayload.password,
};

loginBtn.addEventListener('click', () => {
    login(loginRequestPayload)
        .then(result => console.log(result))
        .catch(err => console.log(err))
    ;
});

const listFilesBtn = document.querySelector('button.listFiles');
listFilesBtn.addEventListener('click', () => {
    listFiles()
        .then(myFiles => console.log(myFiles))
    ;
});


(() => {
    getCurrentUser()
        .then(profile => hello(profile.email))
        .catch(err => hello('Guest'))
    ;
})();