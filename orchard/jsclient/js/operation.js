(function() {
  var Operation;
  Operation = (function() {
    function Operation(instructions) {
      this.instructions = instructions;
    }
    Operation.prototype.push = function(i) {
      return this.instructions.push(i);
    };
    Operation.prototype.push_list = function(list) {
      var i, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        i = list[_i];
        _results.push(this.push(i));
      }
      return _results;
    };
    Operation.prototype.pushinsert = function(addr, pos, value) {
      return this.push([1, addr, pos, value]);
    };
    Operation.prototype.pushdelete = function(addr, victims) {
      return this.push([0, addr].concat(victims));
    };
    Operation.prototype.pushflatinsert = function(pos, value, tree) {
      var trace;
      trace = tree.trace(pos);
      return this.pushinsert(trace.address, tree.pos, value);
    };
    Operation.prototype.pushflatdelete = function(pos, tree) {
      var trace;
      trace = tree.trace(pos);
      return this.pushdelete(trace.address, tree.pos);
    };
    Operation.prototype.pushflatdeletes = function(pos, amount, tree) {
      var i, _results;
      _results = [];
      for (i = 0; 0 <= amount ? i < amount : i > amount; 0 <= amount ? i++ : i--) {
        _results.push(this.pushflatdelete(pos, tree));
      }
      return _results;
    };
    Operation.prototype.apply = function(tree) {
      var i, _i, _len, _ref, _results;
      _ref = this.instructions;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        _results.push(this.apply_instruction(tree, i));
      }
      return _results;
    };
    Operation.prototype.apply_instruction = function(tree, i) {
      var type;
      type = i[0];
      switch (type) {
        case 0:
          return this.apply_deletion(tree, i);
        case 1:
          return this.apply_insertion(tree, i);
      }
    };
    Operation.prototype.apply_deletion = function(tree, i) {
      var addr, pos, target, victims, _i, _len, _results;
      addr = i[1];
      victims = i.slice(2);
      target = tree.resolve(addr);
      _results = [];
      for (_i = 0, _len = victims.length; _i < _len; _i++) {
        pos = victims[_i];
        _results.push(target["delete"](pos));
      }
      return _results;
    };
    Operation.prototype.apply_insertion = function(tree, i) {
      var addr, pos, target, value;
      addr = i[1];
      pos = i[2];
      value = i[3];
      target = tree.resolve(addr);
      return target.insert(pos, value);
    };
    Operation.prototype.proto = function() {
      return {
        "type": "op",
        "instructions": this.instructions
      };
    };
    Operation.prototype.serialize = function() {
      return JSON.stringify(this.proto());
    };
    Operation.prototype.fromTree = function(address, tree) {
      var key, node, nodeaddr, p, _ref, _results;
      _results = [];
      for (p = 0, _ref = tree.length; 0 <= _ref ? p <= _ref : p >= _ref; 0 <= _ref ? p++ : p--) {
        _results.push((function() {
          var _len, _ref2, _results2;
          _ref2 = tree.children[p];
          _results2 = [];
          for (node = 0, _len = _ref2.length; node < _len; node++) {
            key = _ref2[node];
            nodeaddr = address.concat(tree.jump(p, key));
            this.pushinsert(nodeaddr, p, node.value);
            this.pushdelete(nodeaddr, node.deletions);
            _results2.push(this.fromTree(nodeaddr, node));
          }
          return _results2;
        }).call(this));
      }
      return _results;
    };
    return Operation;
  })();
  window.Operation = Operation;
}).call(this);
