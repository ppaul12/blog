from itertools import combinations

Vs = 'HABCDS'
def calcEggs(fatherV: str, motherV: str, childV, maleRate: float, eggType: str) -> int:
	# prepare child V list
	if isinstance(childV, int):
		childVs = list(combinations(Vs, childV))
	elif isinstance(childV, str) and set(childV) < set(Vs):
		childVs = [tuple(childV)]
	else:
		raise RuntimeError('invalid setting for child.')
	# calculate probability
	totalProb = 0
	for childV in childVs:
		tempTotalProb = 0
		for chosenV in combinations(Vs, 5):
			eachProb = 1
			for v in childV:
				itemProb = 0
				if v in chosenV:
					if v in fatherV: itemProb += 0.5
					if v in motherV: itemProb += 0.5
				else:
					itemProb = 1 / 32
				eachProb *= itemProb
			tempTotalProb += eachProb
		tempTotalProb /= 6
		totalProb += tempTotalProb
	# after work
	if eggType == 'male':
		finalProb = totalProb * maleRate
	elif eggType == 'female':
		finalProb = totalProb * (1 - maleRate)
	elif eggType == 'both':
		finalProb = totalProb
	else:
		raise RuntimeError('invalid egg type.')
	try:
		return int (1 / finalProb) + 1
	except ZeroDivisionError:
		return float('inf')

def printRes(fatherV: str, motherV: str, childV, eggs: float) -> None:
	if not fatherV: fatherV = '0V'
	if not motherV: motherV = '0V'
	if isinstance(childV, int): childV = f'{childV}V'
	print('the assumed eggs of', end=' ')
	print(f'{fatherV} + {motherV} = {childV}', end=' ')
	print(f'is {eggs}')

def printMat(eggMat: list) -> None:
	print('Egg matrix:')
	print('   ' + ''.join(f'{str(src):8s}' for src in range(6)))
	for dst in range(6):
		print(f'{dst}  ', end='')
		for src in range(6):
			print(f'{str(eggMat[src][dst]):8s}', end='')
		print()

def solveWithCYK(eggMat: list, start: int, end: int) -> str:
	eggMat = [[(n, col) for col in row] for n, row in enumerate(eggMat)]
	# CYK
	for step in range(2, 6):
		for src in range(6 - step):
			dst = src + step
			for mid in range(src + 1, dst):
				assumedEggNum = eggMat[src][mid][1] + eggMat[mid][dst][1]
				if assumedEggNum < eggMat[src][dst][1]:
					eggMat[src][dst] = (mid, assumedEggNum)
	# print mat
	# printMat(eggMat)
	# track path
	path = [start]
	while path[-1] != (node := eggMat[path[-1]][end][0]):
		path.append(node)
	path.append(end)
	path = ' -> '.join(str(idx) for idx in path)
	eggs = f': {eggMat[start][end][1]} eggs assumed'
	return path + eggs

def solve(FATHER_V, MOTHER_V, CHILD_V, MALE_RATE) -> str:
	# build egg matrix
	eggMat = list()
	for motherVnum in range(6):
		row = []
		for childVnum in range(6):
			motherVs = list(''.join(v) for v in combinations(Vs, motherVnum))
			eggs = sum(calcEggs(
				FATHER_V, motherV, childVnum, MALE_RATE,
				eggType='both' if childVnum == 5 else 'female'
			) for motherV in motherVs)
			row.append(int(eggs / len(list(motherVs))) + 1)
		eggMat.append(row)
	# solve with CYK
	return solveWithCYK(eggMat, MOTHER_V, CHILD_V)
