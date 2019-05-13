const {Repository, Checkout, CheckoutOptions, Signature, Reference, PushOptions, Cred, Enums, Clone} = require("nodegit");
const join = require('path').join;
const fs = require('fs');


const PATH_TO_REPOS = join(__basedir, process.env.REPOS_FOLDER);

const resetRepoState = async(repoData) => {
	const repo = await openRepo(repoData);

	await checkoutRepo(repo);
	await pullRepo(repo, repoData.branch);
}

const openRepo = async(repoData) => {
	try {
		const pathToRepo = getPathToRepo(repoData);
		return Repository.open(pathToRepo);
	} catch(e) {
		console.log(`Cannot open repo ${e}`);
		throw e;
	}
}

const checkoutRepo = async(repo) => {
	let checkoutOptions = new CheckoutOptions()
	checkoutOptions.checkoutStrategy = Checkout.STRATEGY.REMOVE_UNTRACKED | Checkout.STRATEGY.FORCE;
	try {
		return await Checkout.head(repo, checkoutOptions);
	} catch(e) {
		console.log(`Cannot checkout repo: ${e}`);
		throw e;
	}
}

const pullRepo = async(repo, branch) => {
	const pullOptions = {
		fetchOpts: {
			callbacks: {
				certificateCheck: skipCertCheck
			}
		}
	};
	try {
		await repo.fetchAll(pullOptions);
		return await repo.mergeBranches(branch, `origin/${branch}`);
	} catch(e) {
		console.log(`Cannot pull repo: ${e}`);
		throw e;
	}
}

const changeRepoState = async(repoData) => {
	const repo = await openRepo(repoData);
	const author = Signature.now("Clem", "clem@warframeblog.com");
	const message = `Update data: ${new Date().getTime()}`;
	const treeOid = await indexRepoChanges(repo);
	const parent = await getLatestHeadCommitOid(repo);

	const commitId = repo.createCommit('HEAD', author, author, message, treeOid, [parent]);

	return await pushRepoChanges(repo, repoData.branch);
}

const indexRepoChanges = async(repo) => {
	try {
		let repoIndex = await repo.refreshIndex();

		await repoIndex.addAll();
		await repoIndex.write();
		return await repoIndex.writeTree();
	} catch(e) {
		console.log(`Cannot add changed files to index ${e}`);
		throw e;
	}
}

const getLatestHeadCommitOid = async(repo) => {
	try {
		const headRef = await Reference.nameToId(repo, 'HEAD');
		return await repo.getCommit(headRef);
	} catch(e) {
		console.log(`Cannot retrieve head commit oid ${e}`);
		throw e;
	}
}

const pushRepoChanges = async(repo, branch) => {
    const remote = await repo.getRemote('origin');
    const refSpecs = [`refs/heads/${branch}:refs/heads/${branch}`];
	const authenticationCallbacks = {
		certificateCheck: skipCertCheck,
		credentials: onCredentialCheck,
		pushUpdateReference: (refname, message) => {
			if(message) {
				console.log(`Push was not successfull ${message}`);
			}
		}
	};

	try {
	    return await remote.push(refSpecs, { callbacks: authenticationCallbacks });
	} catch(e) {
		console.log(`Cannot push changes: ${e}`);
		throw e;
	}
}

const onCredentialCheck = () => {
	return Cred.userpassPlaintextNew(process.env.GITHUB_TOKEN, 'x-oauth-basic');;
}

const skipCertCheck = () => {
	return 1;
}

const cloneRepo = async(repoData) => {
	const cloneOptions = {
		fetchOpts: {
			callbacks: {
				certificateCheck: skipCertCheck
			}
		}
	};
	try {
		const pathToRepo = getPathToRepo(repoData);
		return await Clone(repoData.url, pathToRepo, cloneOptions);
	} catch(e) {
		console.log(`Cannot clone repo ${repoData.url} to directory ${pathToRepo}: ${e}`);
		throw e;
	}
}

const isRepoClonedSync = (repoData) => {
	try {
		const pathToRepo = getPathToRepo(repoData);
		fs.statSync(pathToRepo);
	} catch(e) {
		return false;
	}

	return true;
}

const getPathToRepo = (repoData) => {
	return join(PATH_TO_REPOS, repoData.name);
}

const transactionWrapper = async (repoData, funcToWrap) => {
	if(!isRepoClonedSync(repoData)) {
		await cloneRepo(repoData);
	}
	return async function() {
		await resetRepoState(repoData);

		let result;
		try {
			result = await funcToWrap({repoData});
		} catch(e) {
			console.log(`Execution of function failed: ${e}`);
			await resetRepoState(repoData);
			throw e;
		}

		if(result && result.some(anyChange => anyChange === true)) {
			await changeRepoState(repoData);
			console.log(`Repo ${repoData.name} state was updated`);
			return true;		
		} else {
			return false;
		}
	};
}

module.exports = {
	transactionWrapper
}