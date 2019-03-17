const {Repository, Checkout, CheckoutOptions, Signature, Reference, PushOptions, Cred, Enums} = require("nodegit");
const path = require('path');

const resetRepoState = async() => {
	const repo = await openRepo();

	await checkoutRepo(repo);
	await pullRepo(repo);
}

const openRepo = async() => {
	try {
		return Repository.open(process.env.LOCAL_REPO_PATH);
	} catch(e) {
		console.log(`Cannot open repo ${e}`);
	}
}

const checkoutRepo = async(repo) => {
	let checkoutOptions = new CheckoutOptions()
	checkoutOptions.checkoutStrategy = Checkout.STRATEGY.REMOVE_UNTRACKED | Checkout.STRATEGY.FORCE;
	try {
		return await Checkout.head(repo, checkoutOptions);
	} catch(e) {
		console.log(`Cannot checkout repo: ${e}`);
	}
}

const pullRepo = async(repo) => {
	try {
		return repo.fetch('origin', {});
	} catch(e) {
		console.log(`Cannot pull repo: ${e}`);
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
	}
}

const getLatestHeadCommitOid = async(repo) => {
	try {
		const headRef = await Reference.nameToId(repo, 'HEAD');
		return await repo.getCommit(headRef);
	} catch(e) {
		console.log(`Cannot retrieve head commit oid ${e}`);
	}
}

const pushRepoChanges = async(repo) => {
    const remote = await repo.getRemote('origin');
    const refSpecs = ['refs/heads/master:refs/heads/master'];
	const authenticationCallbacks = {
		certificateCheck: skipCertCheck,
		credentials: onCredentialCheck,
		pushUpdateReference: (refname, message) => {
			console.log(`Push was not successfull ${message}`);
		}
	};


    return await remote.push(refSpecs, { callbacks: authenticationCallbacks });
}

const onCredentialCheck = () => {
	console.log('Credentials being added to Push Call');
	return Cred.userpassPlaintextNew(process.env.GITHUB_TOKEN, 'x-oauth-basic');;
}

const skipCertCheck = () => {
	return 1;
}

module.exports = {
	resetRepoState,
	changeRepoState
}