const {Repository, Checkout, CheckoutOptions, Signature, Reference, PushOptions, Cred, Enums, Clone} = require("nodegit");
const join = require('path').join;

const PATH_TO_REPO = join(__basedir, process.env.REPO_FOLDER);

const resetRepoState = async() => {
	const repo = await openRepo();

	await checkoutRepo(repo);
	await pullRepo(repo);
}

const openRepo = async() => {
	try {
		return Repository.open(PATH_TO_REPO);
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

const pullRepo = async(repo) => {
	const pullOptions = {
		fetchOpts: {
			callbacks: {
				certificateCheck: skipCertCheck
			}
		}
	};
	try {
		await repo.fetchAll(pullOptions);
		return await repo.mergeBranches(process.env.REPO_BRANCH, `origin/${process.env.REPO_BRANCH}`);
	} catch(e) {
		console.log(`Cannot pull repo: ${e}`);
		throw e;
	}
}

const changeRepoState = async() => {
	const repo = await openRepo();
	const author = Signature.now("Clem", "clem@warframeblog.com");
	const message = `Update data: ${new Date().getTime()}`;
	const treeOid = await indexRepoChanges(repo);
	const parent = await getLatestHeadCommitOid(repo);

	const commitId = repo.createCommit('HEAD', author, author, message, treeOid, [parent]);

	return await pushRepoChanges(repo);
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

const pushRepoChanges = async(repo) => {
    const remote = await repo.getRemote('origin');
    const refSpecs = [`refs/heads/${process.env.REPO_BRANCH}:refs/heads/${process.env.REPO_BRANCH}`];
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

const cloneRepo = async() => {
	const cloneOptions = {
		fetchOpts: {
			callbacks: {
				certificateCheck: skipCertCheck
			}
		}
	};
	try {
		return await Clone(process.env.REPO, PATH_TO_REPO, cloneOptions);
	} catch(e) {
		console.log(`Cannot clone repo ${process.env.repo} to directory ${PATH_TO_REPO}: ${e}`);
		throw e;
	}
}

module.exports = {
	resetRepoState,
	changeRepoState,
	cloneRepo
}