from ejtp.util.crashnicely import Guard
from ConcurrenTree.model import operation
from sys import stderr
import random
import json

class Writer(object):
	def __init__(self, gear):
		self.gear = gear

	def hello(self, target):
		# Send your EJTP encryption credentials to an interface
		self.send(target,
			{
				'type':'mcp-hello',
				'interface':self.interface,
				'key':self.hosts.crypto_get(self.interface),
			},
			False,
		)

	def error(self, target, code=500, message="", data={}):
		self.send(target, {
			"type":"mcp-error",
			"code":code,
			"msg":message,
			"data":data
		})

	def op(self, docname, op, targets=[]):
		# Send an operation frame.
		# targets defaults to document.routes_to for every sender.
		proto = op.proto()
		proto['type'] = 'mcp-op'
		proto['docname'] = docname

		targets = targets or self.gear.document(docname).routes_to(self.interface)

		for i in targets:
			self.send(i, proto)

	def ack(self, target, code):
		self.send(target, {
			"type":"mcp-ack",
			"ackr":code,
		})

	def send(self, target, data, wrap_sender=True):
		data['ackc'] = str(random.randint(0, 2**32))
		self.client.write_json(target, data, wrap_sender)

	# Convenience accessors

	@property
	def client(self):
		return self.gear.client

	@property
	def hosts(self):
		return self.gear.hosts

	@property
	def interface(self):
		return self.gear.interface

class Reader(object):
	def __init__(self, gear):
		self.gear = gear

	def read(self, content, sender=None):
		try:
			content = json.loads(content)
		except:
			print "COULD NOT PARSE JSON:"
			print content
		t = content['type']
		if self.acknowledge(content, sender): return
		if t == "mcp-hello":
			self.gear.gv.hello(content['interface'], content['key'])
		elif t == "mcp-op":
			docname = content['docname']
			op = operation.Operation(content['instructions'])
			self.gear.gv.op(sender, docname, op)
		elif t == "mcp-error":
			print "Error from:", sender, ", code", content["code"]
			print repr(content['msg'])
		else:
			print "Unknown msg type %r" % t

	def acknowledge(self, content, sender):
		if 'ackc' in content and content['type'] != 'mcp-ack':
			ackc = content['ackc']
			print>>stderr, "Recieving message with ack:", ackc
			self.gear.writer.ack(sender, ackc)
			return False
		elif 'ackr' in content and content['type'] == 'mcp-ack':
			print>>stderr, "Recieving ack for:", content['ackr']
			return True
		else:
			print>>stderr, "Malformed frame:\n%s" % json.dumps(content, indent=2)
