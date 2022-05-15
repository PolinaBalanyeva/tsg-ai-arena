/*
 * GET /login
 * Login page.
 */
const getLogin = (req, res) => {
	if (req.user) {
		res.redirect('/');
		return;
	}
	res.render('account/login', {
		title: 'Login',
	});
};

/*
 * GET /logout
 * Log out.
 */
const logout = (req, res) => {
	req.logout();
	res.redirect('/');
};

/*
 * GET /account
 * Profile page.
 */
const getAccount = (req, res) => {
	res.render('account/profile', {
		title: 'Account Management',
	});
};

export default {
	getAccount,
	getLogin,
	logout
}