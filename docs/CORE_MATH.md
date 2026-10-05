# Deterministic liquidity contract

Let b_i be nonnegative integer cents at bank i, T = sum_i b_i, and o_d be
integer cents of obligations on day d, 1 <= d <= 30. The user's affected bank is j,
unavailable fraction is u in [0,1], and duration D is an integer in [1,30].

Blocked cents B = round(b_j u). Cumulative outflows C_d = sum_(k<=d) o_k.
Baseline residual R_d = T - C_d. Scenario residual S_d = T - B 1(d<=D) - C_d.
Unmet obligations Q_d = max(0,-S_d); maximum cumulative shortfall = max_d Q_d.
The first shortfall day is min{d:Q_d>0}, or null if none. Do not sum daily Q_d:
that would count the same unmet obligation repeatedly.

Funds return at the START of day D+1, before that day's obligations. D=30 means
they do not return within the horizon. The model excludes inflows, fees, interest,
intraday sequencing and credit; negative residuals represent unmet obligations.

A hypothetical allocation from bank i to k of a cents replaces b_i with b_i-a
and b_k with b_k+a. Require i!=k, 0<a<=b_i and valid resulting balances. Thus
T' = T-a+a = T. Confirmation binds to the reviewed scenario and any input change
invalidates the proposal. The code recomputes results rather than trusting imported
financial outputs. Source text never supplies tool commands.

For minimum preparation to a selected destination k, search integer cents from
1 through min(b_j, M-b_k), where M=10^12 cents is the supported per-bank ceiling.
If no positive capacity or the upper bound still has unmet obligations, report
infeasible for that destination. If obligations exceed T, no redistribution can
cover them. Otherwise, Q_d is nonincreasing as the allocation grows because
round((b_j-a)u) is nonincreasing. Binary search finds the first feasible cent.
The sample's minimum is $21,250; one cent less leaves $0.01 unmet.

Dollar inputs are converted once to cent integers. Decimal dollar values near
the ceiling can have binary floating-point conversion error. Validation allows
at most max(0.0001, 2 epsilon |100x|) cents of that error, while rejecting meaningful
sub-cent values. Sums remain safe integers: 32 balances and 100 obligations each
bounded at 10^12 cents stay below JavaScript's 2^53 integer limit.

Worked case: T=$180,000, b_j=$90,000, u=80%, D=21. B=$72,000. Obligations are
$85,000 on day 5, $40,000 on day 15 and $25,000 on day 25. On day 15 S=$108,000
-$125,000=-$17,000. Day 22 releases funds, so S=$55,000. Simulating a $20,000
reallocation out of j changes B to $56,000 and the peak shortfall to $1,000.
These are user-supplied example assumptions, not observed balances.

## Research model separation

Ridge predicts next-quarter deposit growth using X in R^(n x p), coefficients
w in R^p, and penalty lambda: minimize ||y-Xw||² + lambda||w||², with unpenalized
intercept. The scaler is fit on training observations only; lambda is selected on
validation. No model estimate enters u, D, b_i or o_d.

Graph adjacency A in R^(N x N) represents normalized deposit-geography similarity,
with zero diagonal and at most five retained neighbours. Aggregation AX preserves
feature width p. An ablation with A=0 separates network information from neural
capacity. Similarity is not a causal contagion mechanism. Existing retrospective
data do not establish point-in-time availability or a bank failure probability.
