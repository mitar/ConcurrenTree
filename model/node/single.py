import node

class SingleNode(node.Node):
	def __init__(self):
		self._children = node.ChildSet()

	# Node interface

	@property
	def value(self):
		return ""

	@property
	def key(self):
		return "/single"

	def flatten(self):
		if len(self._children) > 0:
			return self._children.head.flatten()
		else:
			return None

	def get(self, pos, key):
		if pos != 0:
			raise IndexError("SingleNode only has children at pos 0")
		return self._children[key]

	def put(self, pos, obj):
		if pos != 0:
			raise IndexError("SingleNode only has children at pos 0")
		self._children.insert(obj)

	def delete(self):
		raise node.Undelable("SingleNodes do not support deletion. Recursive set to null instead.")

	@property
	def children(self):
		return [self._children]

	@property
	def deletions(self):
		return []

	def proto(self):
		pass # TODO - protocol rep of adv types